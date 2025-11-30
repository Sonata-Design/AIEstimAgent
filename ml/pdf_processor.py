"""
PDF Processing Module for EstimAgent
Handles multi-page PDF processing and page classification using Roboflow Inference SDK.
"""

import os
import logging
import base64
import requests
from io import BytesIO
from typing import List, Dict, Any
from concurrent.futures import ThreadPoolExecutor, as_completed

# PDF & Image processing
import PyPDF2
from pdf2image import convert_from_path
from PIL import Image

# Roboflow SDK for classification (used if classify_fn not provided)
try:
    from roboflow import Roboflow
except ImportError:
    Roboflow = None

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PDFProcessor:
    """
    Process multi-page construction PDFs and classify pages using Roboflow hosted inference.
    """
    
    def __init__(self, classify_fn=None):
        """
        Initialize PDFProcessor.
        
        Args:
            classify_fn: Optional classification function from app.py (_classify_image).
                        If provided, will be used instead of direct HTTP requests.
        """
        # Load Configuration
        self.api_key = os.getenv('PAGE_API_KEY', '')
        self.workspace = os.getenv('PAGE_WORKSPACE', '')
        self.project_id = os.getenv('PAGE_PROJECT', '')
        self.version = os.getenv('PAGE_VERSION', '')
        
        # Store classification function (from app.py)
        self.classify_fn = classify_fn
        
        logger.info(f"PDFProcessor initialized. Project: {self.project_id}, Version: {self.version}")
        logger.info(f"API Key: {'***' + self.api_key[-4:] if self.api_key else 'NOT SET'}")
        logger.info(f"Using {'external' if classify_fn else 'built-in'} classification function")

    def process_pdf(self, pdf_path: str, output_dir: str) -> Dict[str, Any]:
        """
        Main entry point: Convert PDF to images and classify each page.
        """
        if not os.path.exists(pdf_path):
            raise FileNotFoundError(f"PDF file not found: {pdf_path}")

        # 1. Create output directory
        os.makedirs(output_dir, exist_ok=True)

        # 2. Get PDF Metadata
        try:
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                total_pages = len(pdf_reader.pages)
        except Exception as e:
            logger.error(f"Failed to read PDF metadata: {e}")
            raise Exception(f"Invalid PDF file: {str(e)}")

        logger.info(f"Processing {total_pages} pages from {os.path.basename(pdf_path)}")

        # 3. Convert PDF to Images
        # Thread count of 4 is usually optimal for standard PDFs
        try:
            images = convert_from_path(
                pdf_path, 
                dpi=300,
                fmt='jpeg',
                thread_count=4
            )
        except Exception as e:
            logger.error(f"pdf2image conversion failed: {e}")
            raise Exception("Failed to convert PDF pages to images. Ensure Poppler is installed.")

        # 4. Save all images first
        image_paths = []
        thumbnails = {}
        
        for i, image in enumerate(images):
            page_num = i + 1
            filename = f"page_{page_num}.jpg"
            image_path = os.path.join(output_dir, filename)
            
            # Save full resolution image to disk
            image.save(image_path, 'JPEG', quality=95)
            image_paths.append((page_num, image_path))
            
            # Generate UI Thumbnail (Base64)
            thumbnails[page_num] = self._generate_thumbnail_b64(image)
        
        # 5. Parallel Classification - Process up to 4 pages simultaneously
        processed_pages = []
        max_workers = min(4, len(image_paths))  # Use up to 4 parallel workers
        
        logger.info(f"Starting parallel classification with {max_workers} workers for {len(image_paths)} pages")
        
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Submit all classification tasks
            future_to_page = {
                executor.submit(self._classify_page, image_path): page_num 
                for page_num, image_path in image_paths
            }
            
            # Collect results as they complete
            for future in as_completed(future_to_page):
                page_num = future_to_page[future]
                image_path = next(path for num, path in image_paths if num == page_num)
                
                try:
                    classification = future.result()
                    
                    # Structure Data
                    page_data = {
                        'page_number': page_num,
                        'image_path': image_path,
                        'thumbnail': thumbnails.get(page_num, ""),
                        # Classification Data
                        'type': classification['type'],
                        'confidence': classification['confidence'],
                        'title': classification['title'],
                        'analyzable': classification['analyzable'],
                        'metadata': classification['metadata']
                    }
                    
                    processed_pages.append(page_data)
                    logger.info(f"Page {page_num}: {classification['title']} ({classification['confidence']:.1%})")
                    
                except Exception as e:
                    logger.error(f"Error processing page {page_num}: {e}")
                    # Fallback for individual page failure
                    processed_pages.append({
                        'page_number': page_num,
                        'image_path': image_path,
                        'thumbnail': thumbnails.get(page_num, ""),
                        'type': 'unknown',
                        'confidence': 0.0,
                        'title': 'Processing Error',
                        'analyzable': False,
                        'metadata': {'error': str(e)}
                    })

        return {
            'total_pages': total_pages,
            'pages': processed_pages,
            'pdf_path': pdf_path
        }

    def _classify_page(self, image_path: str) -> Dict[str, Any]:
        """
        Sends image to Roboflow Classification API.
        Uses external classify_fn if provided, otherwise uses direct HTTP POST.
        Includes retry logic for transient failures.
        Compresses image before sending to speed up API requests.
        """
        import time
        max_retries = 3
        retry_delay = 1  # Reduced from 2 to speed up retries
        
        # Compress image for faster API transmission
        compressed_path = image_path.replace('.jpg', '_compressed.jpg')
        try:
            img = Image.open(image_path)
            # Resize to max 1024px while maintaining aspect ratio
            img.thumbnail((1024, 1024), Image.Resampling.LANCZOS)
            img.save(compressed_path, 'JPEG', quality=75, optimize=True)
            classify_image_path = compressed_path
            logger.debug(f"Compressed image for faster classification: {image_path}")
        except Exception as e:
            logger.warning(f"Could not compress image, using original: {e}")
            classify_image_path = image_path
        
        for attempt in range(max_retries):
            try:
                logger.info(f"Classifying {image_path} (attempt {attempt + 1}/{max_retries})")
                
                # Use external function if provided (from app.py)
                if self.classify_fn:
                    result = self.classify_fn(
                        image_path=classify_image_path,  # Use compressed image
                        project_id=self.project_id,
                        version=self.version,
                        api_key=self.api_key,
                        workspace=self.workspace
                    )
                else:
                    # Fallback: Use InferenceHTTPClient with serverless endpoint
                    from inference_sdk import InferenceHTTPClient
                    
                    client = InferenceHTTPClient(
                        api_url="https://serverless.roboflow.com",
                        api_key=self.api_key
                    )
                    model_id = f"{self.project_id}/{self.version}"
                    result = client.infer(classify_image_path, model_id=model_id)  # Use compressed image
                
                logger.debug(f"API Response keys: {result.keys()}")
                
                # Parse Response - Roboflow Serverless format:
                # {
                #   "top": "class_name",
                #   "confidence": 0.97,
                #   "predictions": [{"class": "class_name", "confidence": 0.97}]
                # }
                
                top_class = "unknown"
                confidence = 0.0

                # Primary: Use 'top' and 'confidence' fields (serverless format)
                if 'top' in result and 'confidence' in result:
                    top_class = result['top']
                    confidence = float(result['confidence'])
                    logger.info(f"✓ Classification: {top_class} ({confidence:.1%})")
                    return self._map_classification_result(top_class, confidence)
                
                # Fallback: Use predictions array
                if 'predictions' in result and isinstance(result['predictions'], list) and result['predictions']:
                    top_pred = result['predictions'][0]
                    top_class = top_pred.get('class', 'unknown')
                    confidence = float(top_pred.get('confidence', 0.0))
                    logger.info(f"✓ Classification: {top_class} ({confidence:.1%})")
                    return self._map_classification_result(top_class, confidence)
                
                # If we get here, response format is unexpected
                logger.warning(f"Unexpected response format. Keys: {list(result.keys())}")
                logger.debug(f"Full response: {result}")
                return self._map_classification_result("unknown", 0.0)

            except requests.exceptions.Timeout:
                logger.warning(f"Attempt {attempt + 1} failed: Request timeout")
                if attempt < max_retries - 1:
                    logger.info(f"Retrying in {retry_delay}s...")
                    time.sleep(retry_delay)
                    
            except requests.exceptions.HTTPError as e:
                error_msg = f"HTTP {e.response.status_code}: {e.response.text[:200]}"
                logger.warning(f"Attempt {attempt + 1} failed: {error_msg}")
                
                if attempt == max_retries - 1:
                    logger.error(f"❌ Classification failed after {max_retries} attempts")
                    logger.error(f"Project: {self.project_id}, Version: {self.version}")
                    logger.error(f"Error: {error_msg}")
                elif attempt < max_retries - 1:
                    logger.info(f"Retrying in {retry_delay}s...")
                    time.sleep(retry_delay)
                    
            except Exception as e:
                error_msg = str(e)
                logger.warning(f"Attempt {attempt + 1} failed: {error_msg[:200]}")
                
                if attempt == max_retries - 1:
                    logger.error(f"❌ Classification failed after {max_retries} attempts")
                    logger.error(f"Project: {self.project_id}, Version: {self.version}")
                    logger.error(f"Error: {error_msg}")
                elif attempt < max_retries - 1:
                    logger.info(f"Retrying in {retry_delay}s...")
                    time.sleep(retry_delay)
        
        # All retries exhausted
        return self._map_classification_result("unknown", 0.0)

    def _map_classification_result(self, raw_class: str, confidence: float) -> Dict[str, Any]:
        """
        Maps Roboflow raw class names to system standard names and titles.
        """
        raw_lower = raw_class.lower().strip()

        # Mapping Logic: 'roboflow_label' -> 'system_type'
        mapping = {
            'floor_plan': 'floor_plan', 'floor plan': 'floor_plan',
            'elevation': 'elevation',
            'section': 'section',
            'electrical': 'electrical_plan', 'electrical_plan': 'electrical_plan',
            'plumbing': 'plumbing_plan', 'plumbing_plan': 'plumbing_plan',
            'hvac': 'hvac_plan', 'hvac_plan': 'hvac_plan',
            'site': 'site_plan', 'site_plan': 'site_plan',
            'detail': 'detail',
            'notes': 'notes',
            'cover': 'cover_page', 'cover_page': 'cover_page',
            'schedule': 'schedule'
        }

        page_type = mapping.get(raw_lower, 'unknown')

        # Formatting Title
        title = page_type.replace('_', ' ').title()
        if page_type == 'unknown':
            title = "Unknown Page"

        # Determine Analyzability
        # Notes, Covers, and Schedules are generally not analyzed by geometric AI
        not_analyzable = ['notes', 'cover_page', 'schedule', 'unknown']
        analyzable = page_type not in not_analyzable

        return {
            'type': page_type,
            'confidence': float(confidence),
            'title': title,
            'analyzable': analyzable,
            'metadata': {
                'model_used': f"{self.project_id}/{self.version}",
                'raw_class': raw_class
            }
        }

    def _generate_thumbnail_b64(self, image: Image.Image, max_size: int = 1200) -> str:
        """Create a high-quality base64 thumbnail for the UI."""
        thumb = image.copy()
        thumb.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
        
        buffered = BytesIO()
        thumb.save(buffered, format="JPEG", quality=85)
        img_str = base64.b64encode(buffered.getvalue()).decode()
        
        return f"data:image/jpeg;base64,{img_str}"