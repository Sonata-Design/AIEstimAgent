#!/usr/bin/env python3
"""Test Roboflow Classification using SDK (the working method)"""

import os
from dotenv import load_dotenv
from roboflow import Roboflow
from PIL import Image

load_dotenv()

# Load environment variables
api_key = os.getenv('PAGE_API_KEY', 'dCEzIpaPW5f2pc2T9ibl')
workspace = os.getenv('PAGE_WORKSPACE', 'shakil-malek')
project = os.getenv('PAGE_PROJECT', 'classification-model-wzzrh')
version = os.getenv('PAGE_VERSION', '3')

print("=" * 80)
print("ROBOFLOW SDK CLASSIFICATION TEST")
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
    test_img = Image.new('RGB', (200, 200), color='white')
    test_path = 'test_classification.jpg'
    test_img.save(test_path, 'JPEG')
    print(f"   ✓ Test image saved: {test_path}")
    
    print("\n5. Running prediction...")
    result = model.predict(test_path)
    print("   ✓ Prediction successful!")
    
    print("\n6. Result:")
    result_json = result.json()
    print(f"   Response keys: {list(result_json.keys())}")
    
    if 'predictions' in result_json:
        print(f"\n   Predictions: {result_json['predictions']}")
    
    if 'predicted_classes' in result_json:
        print(f"   Predicted Classes: {result_json['predicted_classes']}")
        if result_json['predicted_classes']:
            top_class = result_json['predicted_classes'][0]
            if top_class in result_json['predictions']:
                confidence = result_json['predictions'][top_class].get('confidence', 0)
                print(f"\n   ✓ Top Prediction: {top_class} ({confidence:.1%})")
    
    # Clean up
    import os
    os.remove(test_path)
    
    print("\n" + "=" * 80)
    print("✓ SUCCESS! Classification is working via SDK!")
    print("=" * 80)
    
except Exception as e:
    print(f"\n✗ ERROR: {e}")
    print("\n" + "=" * 80)
    print("FAILED")
    print("=" * 80)
    import traceback
    traceback.print_exc()
