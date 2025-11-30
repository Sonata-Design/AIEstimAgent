import os
import io
import time
import fitz  # PyMuPDF
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaFileUpload, MediaIoBaseDownload, MediaIoBaseUpload

# --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
# 1. CONFIGURE YOUR FOLDERS & SETTINGS HERE
# --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

# Get your folder IDs from the Google Drive URL:
# https://drive.google.com/drive/folders/THIS_IS_THE_ID
SOURCE_FOLDER_ID = "1YwCKaN677Ayu185TocnxRBsR273Mzrfo"
DESTINATION_FOLDER_ID = "1fnMW0DRDjyUDeq0sV9dZ4iv1bWEf0gBn"

# Settings for the conversion
IMAGE_FORMAT = "png"  # "png" or "jpeg"
IMAGE_DPI = 144       # 72 is screen-res, 144 is good, 300 is high-quality print

# --- NEW SETTINGS ---
MAX_PAGES_TO_CONVERT = 15  # Skips any PDF with more pages than this
UPLOAD_RETRIES = 3         # How many times to retry a failed upload

# --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

# If modifying these scopes, delete the file token.json.
SCOPES = ['https://www.googleapis.com/auth/drive']

def get_drive_service():
    """
    Authenticates with the Google Drive API and returns a service object.
    """
    creds = None
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                'credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
        with open('token.json', 'w') as token:
            token.write(creds.to_json())

    try:
        service = build('drive', 'v3', credentials=creds)
        print("Google Drive API authentication successful.")
        return service
    except HttpError as error:
        print(f'An error occurred: {error}')
        return None

def find_files_in_folder(service, query, fields="files(id, name)"):
    """
    A generic helper function to find files matching a query.
    Handles pagination and Shared Drive support.
    """
    files = []
    page_token = None
    try:
        while True:
            results = service.files().list(
                q=query,
                fields=f"nextPageToken, {fields}",
                pageSize=100,
                supportsAllDrives=True,
                includeItemsFromAllDrives=True,
                pageToken=page_token
            ).execute()
            
            items = results.get('files', [])
            files.extend(items)
            
            page_token = results.get('nextPageToken', None)
            if page_token is None:
                break
        return files
    except HttpError as error:
        print(f'An error occurred searching for files: {error}')
        return []

def get_existing_images(service, folder_id):
    """
    Gets a set of all filenames in the destination folder for skipping.
    """
    print(f"Checking for existing images in destination folder...")
    query = f"'{folder_id}' in parents and trashed=false"
    files = find_files_in_folder(service, query, fields="files(name)")
    
    # Use a set for fast O(1) lookups
    filenames = {f.get('name') for f in files}
    print(f"Found {len(filenames)} existing images to skip.")
    return filenames

def convert_pdf_to_images(pdf_bytes, base_filename):
    """
    Converts PDF bytes into a list of image bytes (one per page).
    Returns a list of tuples: (filename, image_bytes)
    Returns None if the PDF is skipped due to page count.
    """
    images = []
    try:
        # Open the PDF from in-memory bytes
        pdf_doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        
        page_count = len(pdf_doc)

        # --- NEW: Check page count limit ---
        if page_count > MAX_PAGES_TO_CONVERT:
            print(f"  > SKIPPING: PDF has {page_count} pages (limit is {MAX_PAGES_TO_CONVERT}).")
            pdf_doc.close()
            return None  # Special value to indicate a skip
        # --- --- --- --- --- --- --- --- ---

        print(f"  > Found {page_count} pages. Converting...")
        
        zoom = IMAGE_DPI / 72.0
        matrix = fitz.Matrix(zoom, zoom)

        for page_num in range(page_count):
            page = pdf_doc.load_page(page_num)
            pix = page.get_pixmap(matrix=matrix)
            img_bytes = pix.tobytes(output=IMAGE_FORMAT)
            
            img_filename = f"{base_filename}_page_{page_num + 1}.{IMAGE_FORMAT}"
            images.append((img_filename, img_bytes))

        pdf_doc.close()
        return images
    
    except Exception as e:
        print(f"  > ERROR converting PDF '{base_filename}': {e}")
        return []

def upload_image_to_drive(service, filename, image_bytes, folder_id):
    """
    Uploads a single image (from bytes) to the specified Drive folder.
    --- NEW: Includes a retry mechanism for network errors ---
    """
    file_metadata = {
        'name': filename,
        'parents': [folder_id]
    }
    mimetype = f'image/{IMAGE_FORMAT}'
    media = MediaIoBaseUpload(io.BytesIO(image_bytes), mimetype=mimetype, resumable=True)
    
    for attempt in range(UPLOAD_RETRIES):
        try:
            file = service.files().create(
                body=file_metadata,
                media_body=media,
                fields='id',
                supportsAllDrives=True
            ).execute()
            print(f"  > Successfully uploaded '{filename}' (ID: {file.get('id')})")
            return  # Success, exit the function

        except (TimeoutError, HttpError) as error:
            print(f"  > FAILED upload for '{filename}' (Attempt {attempt + 1}/{UPLOAD_RETRIES}): {error}")
            if attempt < UPLOAD_RETRIES - 1:
                sleep_time = 5 * (attempt + 1)  # 5s, 10s
                print(f"  > Retrying in {sleep_time} seconds...")
                time.sleep(sleep_time)
            else:
                print(f"  > PERMANENTLY FAILED to upload '{filename}' after {UPLOAD_RETRIES} attempts.")
        except Exception as e:
            print(f"  > An unexpected error occurred uploading '{filename}': {e}")
            return # Don't retry on unknown errors

def main():
    """
    Main function to run the conversion and upload process.
    """
    service = get_drive_service()
    if not service:
        return

    # Get all existing image names to avoid re-uploading
    existing_images = get_existing_images(service, DESTINATION_FOLDER_ID)
    
    # Get PDF files
    pdf_query = (
        f"'{SOURCE_FOLDER_ID}' in parents and "
        "mimeType='application/pdf' and "
        "trashed=false"
    )
    pdf_files = find_files_in_folder(service, pdf_query, fields="files(id, name)")
    
    if not pdf_files:
        print(f"No PDF files found in the source folder.")
        return
    else:
        print(f"Found {len(pdf_files)} PDF(s) to process.")

    for pdf_file in pdf_files:
        pdf_id = pdf_file.get('id')
        pdf_name = pdf_file.get('name')
        base_name = os.path.splitext(pdf_name)[0]
        
        print(f"\nProcessing '{pdf_name}' (ID: {pdf_id})...")

        # --- THIS IS THE UPDATED PART ---
        # This try/except block now wraps the *entire* process for one file
        # and catches *any* exception, so one bad file won't stop the script.
        try:
            # 1. Download the PDF file into memory
            request = service.files().get_media(fileId=pdf_id)
            fh = io.BytesIO()
            downloader = MediaIoBaseDownload(fh, request)
            
            done = False
            while not done:
                status, done = downloader.next_chunk()
            
            print("  > Download complete. Starting conversion...")
            fh.seek(0)
            pdf_data = fh.read()
            fh.close()
            
            # 2. Convert PDF bytes to image bytes
            images_to_upload = convert_pdf_to_images(pdf_data, base_name)
            
            # Check for skip signal (None)
            if images_to_upload is None:
                continue # PDF was skipped due to page count

            if not images_to_upload:
                continue # Error during conversion

            # 3. Upload each image to the destination folder
            print(f"  > Uploading {len(images_to_upload)} image(s)...")
            for img_name, img_bytes in images_to_upload:
                
                # Skip if image already exists
                if img_name in existing_images:
                    print(f"  > Skipping already uploaded '{img_name}'")
                    continue
                
                upload_image_to_drive(service, img_name, img_bytes, DESTINATION_FOLDER_ID)

        except Exception as error:
            # This will now catch SSL errors, download errors, etc.
            print(f"  > !!! FAILED to process '{pdf_name}'. Error: {error}")
            print(f"  > Skipping to next file.")
        # --- END OF UPDATED PART ---
        
    print("\n--- All done! ---")

if __name__ == '__main__':
    main()