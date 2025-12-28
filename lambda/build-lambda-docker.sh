#!/bin/bash

# Script to build Lambda function using Docker (ensures Linux-compatible binaries)

echo "Building Lambda function for AWS Lambda (Linux)..."

# Create temporary build directory
BUILD_DIR="lambda-build"
rm -rf $BUILD_DIR
mkdir -p $BUILD_DIR

# Copy Lambda source code
echo "Copying source files..."
cp index.js $BUILD_DIR/
cp package.json $BUILD_DIR/

# Use Docker to install dependencies for Linux
echo "Installing dependencies using Docker (this ensures Linux-compatible binaries)..."
docker run --rm \
  -v "$(pwd)/$BUILD_DIR":/var/task \
  -w /var/task \
  public.ecr.aws/lambda/nodejs:20 \
  npm install --production

# Create deployment package
echo "Creating deployment package..."
cd $BUILD_DIR
zip -r ../lambda-deployment.zip .

# Cleanup
cd ..
rm -rf $BUILD_DIR

echo "✓ Lambda deployment package created: lambda-deployment.zip"
echo "File size: $(du -h lambda-deployment.zip | cut -f1)"
echo ""
echo "Next steps:"
echo "1. Copy lambda-deployment.zip to terraform directory:"
echo "   cp lambda-deployment.zip ../terraform/"
echo "2. Run 'terraform apply' to deploy the updated Lambda"
