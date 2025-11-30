#!/usr/bin/env python3
"""Test Roboflow Classification API endpoint"""

import os
import requests
import base64
from dotenv import load_dotenv

load_dotenv()

# Load environment variables
api_key = os.getenv('PAGE_API_KEY', 'dCEzIpaPW5f2pc2T9ibl')
workspace = os.getenv('PAGE_WORKSPACE', 'shakil-malek')
project = os.getenv('PAGE_PROJECT', 'classification-model-wzzrh')
version = os.getenv('PAGE_VERSION', '3')

print("=" * 80)
print("ROBOFLOW CLASSIFICATION API TEST")
print("=" * 80)
print(f"API Key: {api_key[:10]}...{api_key[-4:]}")
print(f"Workspace: {workspace}")
print(f"Project: {project}")
print(f"Version: {version}")
print("=" * 80)

# Test both URL formats
url_with_workspace = f"https://classify.roboflow.com/{workspace}/{project}/{version}"
url_without_workspace = f"https://classify.roboflow.com/{project}/{version}"

print(f"\n1. Testing endpoint WITH workspace: {url_with_workspace}")
print(f"   Method: POST")
print(f"   API Key: ***{api_key[-4:]}")

url = url_without_workspace  # Try without workspace first

# Create a small test image (1x1 white pixel)
import io
from PIL import Image
test_img = Image.new('RGB', (100, 100), color='white')
buffer = io.BytesIO()
test_img.save(buffer, format='JPEG')
test_image_data = base64.b64encode(buffer.getvalue()).decode('utf-8')

try:
    print(f"\n2. Trying WITHOUT workspace: {url}")
    params = {'api_key': api_key}
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    # Send base64 string directly as body (not in a dict)
    data = test_image_data
    
    response = requests.post(url, params=params, data=data, headers=headers, timeout=30)
    
    # If that fails, try with workspace
    if response.status_code != 200:
        print(f"\n   Failed ({response.status_code}), trying WITH workspace...")
        response = requests.post(url_with_workspace, params=params, data=data, headers=headers, timeout=30)
    
    print(f"\n3. Response Status: {response.status_code}")
    print(f"   Response Headers: {dict(response.headers)}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"\n✓ SUCCESS! Model is working!")
        print(f"\nResponse:")
        import json
        print(json.dumps(result, indent=2))
    else:
        print(f"\n✗ ERROR: HTTP {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 500:
            print("\n⚠️  500 Error = Model not deployed or misconfigured on Roboflow")
            print("\nAction Required:")
            print("1. Go to https://app.roboflow.com")
            print(f"2. Open project: {project}")
            print(f"3. Check version {version} status")
            print("4. Ensure model is trained and deployed")
        elif response.status_code == 403:
            print("\n⚠️  403 Error = API key doesn't have access")
        elif response.status_code == 404:
            print("\n⚠️  404 Error = Project or version doesn't exist")
    
except requests.exceptions.Timeout:
    print("\n✗ ERROR: Request timeout (30s)")
except Exception as e:
    print(f"\n✗ ERROR: {e}")

print("\n" + "=" * 80)
