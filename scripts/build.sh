#!/bin/bash

# Build script for nexaApply
echo "Building nexaApply..."

# Clean dist directory
rm -rf dist/
mkdir dist/

# Run webpack
echo "Running webpack build..."
npm run build

# Copy documentation
echo "Copying documentation..."
mkdir -p dist/docs
cp -r docs/* dist/docs/

# Create store assets
echo "Creating store assets..."
mkdir -p dist/store-assets
cp assets/images/screenshot*.png dist/store-assets/
cp assets/images/promotional*.png dist/store-assets/
cp docs/user/privacy-policy.md dist/store-assets/

# Create zip for Chrome Web Store
echo "Creating extension package..."
cd dist
zip -r ../nexaApply-extension.zip ./*

echo "Build complete! Package created at nexaApply-extension.zip"
