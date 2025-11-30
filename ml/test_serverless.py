#!/usr/bin/env python3
"""Test Roboflow Serverless endpoint"""

from inference_sdk import InferenceHTTPClient
from PIL import Image
import os

# Initialize the client with serverless endpoint
CLIENT = InferenceHTTPClient(
    api_url="https://serverless.roboflow.com",
    api_key="86sWXHROJPq5Gq1IwqPb"
)

print("=" * 80)
print("ROBOFLOW SERVERLESS ENDPOINT TEST")
print("=" * 80)
print(f"API URL: https://serverless.roboflow.com")
print(f"Model ID: page_classification-1wyvu/1")
print("=" * 80)

try:
    # Create test image
    print("\n1. Creating test image...")
    test_img = Image.new('RGB', (200, 200), color='white')
    test_path = 'test_serverless.jpg'
    test_img.save(test_path, 'JPEG')
    print(f"   ✓ Test image saved: {test_path}")
    
    print("\n2. Running inference...")
    result = CLIENT.infer(test_path, model_id="page_classification-1wyvu/1")
    print("   ✓ Inference successful!")
    
    print("\n3. Result:")
    print(f"   Response keys: {list(result.keys())}")
    print(f"\n   Full response:")
    import json
    print(json.dumps(result, indent=2))
    
    # Clean up
    os.remove(test_path)
    
    print("\n" + "=" * 80)
    print("✓ SUCCESS! Serverless endpoint is working!")
    print("=" * 80)
    
except Exception as e:
    print(f"\n✗ ERROR: {e}")
    print("\n" + "=" * 80)
    print("FAILED")
    print("=" * 80)
    import traceback
    traceback.print_exc()
