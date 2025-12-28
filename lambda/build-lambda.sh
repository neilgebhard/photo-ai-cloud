#!/bin/bash

# Script to build and package Lambda function for deployment

echo "Building Lambda function..."

# Create temporary build directory
BUILD_DIR="lambda-build"
rm -rf $BUILD_DIR
mkdir -p $BUILD_DIR

# Copy Lambda source code
echo "Copying source files..."
cp index.js $BUILD_DIR/
cp package.json $BUILD_DIR/

# Install dependencies
echo "Installing dependencies..."
cd $BUILD_DIR
npm install --production

# Create deployment package
echo "Creating deployment package..."
zip -r ../lambda-deployment.zip .

# Cleanup
cd ..
rm -rf $BUILD_DIR

echo "Lambda deployment package created: lambda-deployment.zip"
echo "File size: $(du -h lambda-deployment.zip | cut -f1)"
echo ""
echo "Next steps:"
echo "1. Run 'terraform init' in the terraform directory"
echo "2. Run 'terraform plan' to preview changes"
echo "3. Run 'terraform apply' to deploy"
