#!/bin/bash
set -e

echo "🚀 Starting ML Service Build..."

echo "📦 Installing system dependencies..."
apt-get update
apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-eng \
    poppler-utils

echo "🐍 Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "✅ Verifying Tesseract installation..."
tesseract --version

echo "✅ Verifying poppler installation..."
pdftoppm -v

echo "🎉 Build complete!"
