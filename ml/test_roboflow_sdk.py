#!/usr/bin/env python3
"""Test Roboflow using the official Python SDK"""

import os
from dotenv import load_dotenv
from roboflow import Roboflow

load_dotenv()

# Load environment variables
api_key = os.getenv('PAGE_API_KEY', 'dCEzIpaPW5f2pc2T9ibl')
workspace = os.getenv('PAGE_WORKSPACE', 'shakil-malek')
project = os.getenv('PAGE_PROJECT', 'classification-model-wzzrh')
version = os.getenv('PAGE_VERSION', '3')

print("=" * 80)
print("ROBOFLOW SDK TEST")
print("=" * 80)
print(f"API Key: {api_key[:10]}...{api_key[-4:]}")
print(f"Workspace: {workspace}")
print(f"Project: {project}")
print(f"Version: {version}")
print("=" * 80)

try:
    print("\n1. Initializing Roboflow...")
    rf = Roboflow(api_key=api_key)
    print("   ✓ Roboflow initialized")
    
    print(f"\n2. Loading project: {workspace}/{project}")
    project_obj = rf.workspace(workspace).project(project)
    print("   ✓ Project loaded")
    
    print(f"\n3. Loading model version: {version}")
    model = project_obj.version(version).model
    print("   ✓ Model loaded")
    
    # Create test image
    print("\n4. Creating test image...")
    from PIL import Image
    import io
    test_img = Image.new('RGB', (100, 100), color='white')
    test_path = 'test_image.jpg'
    test_img.save(test_path, 'JPEG')
    print(f"   ✓ Test image saved: {test_path}")
    
    print("\n5. Running prediction...")
    result = model.predict(test_path)
    print("   ✓ Prediction successful!")
    
    print("\n6. Result:")
    print(f"   {result}")
    
    # Clean up
    import os
    os.remove(test_path)
    
    print("\n" + "=" * 80)
    print("✓ SUCCESS! Model is working via SDK!")
    print("=" * 80)
    
except Exception as e:
    print(f"\n✗ ERROR: {e}")
    print("\n" + "=" * 80)
    print("FAILED")
    print("=" * 80)
    import traceback
    traceback.print_exc()
