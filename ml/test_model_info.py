#!/usr/bin/env python3
"""Test if we can access model metadata"""

import requests

api_key = 'dCEzIpaPW5f2pc2T9ibl'
project = 'classification-model-wzzrh'
version = '3'

print("=" * 80)
print("TESTING MODEL METADATA ACCESS")
print("=" * 80)

# Try to get model info
info_url = f"https://api.roboflow.com/{project}/{version}"
print(f"\n1. Trying metadata endpoint: {info_url}")

try:
    response = requests.get(info_url, params={'api_key': api_key}, timeout=10)
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.text[:500]}")
except Exception as e:
    print(f"   Error: {e}")

# Try alternate endpoint
alt_url = f"https://api.roboflow.com/shakil-malek/{project}/{version}"
print(f"\n2. Trying with workspace: {alt_url}")

try:
    response = requests.get(alt_url, params={'api_key': api_key}, timeout=10)
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.text[:500]}")
except Exception as e:
    print(f"   Error: {e}")

print("\n" + "=" * 80)
