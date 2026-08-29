#!/bin/bash
# Deployment script for Mudmy - Hostinger
# This script creates a clean build and packages it for deployment

echo "🚀 Starting Mudmy Deployment Preparation..."
echo ""

# Remove old builds
echo "🧹 Cleaning old builds..."
rm -rf .next
rm -rf build
rm -f mudmy-deployment.zip
echo "✅ Clean complete"
echo ""

# Build the project
echo "🔨 Building Next.js project..."
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Build failed! Please fix the errors first."
  exit 1
fi
echo "✅ Build successful!"
echo ""

# Create deployment package
echo "📦 Creating deployment package..."
zip -r mudmy-deployment.zip \
  next.config.* \
  package.json \
  package-lock.json \
  public/ \
  .next/ \
  lib/ \
  components/ \
  app/ \
  -x "*.DS_Store" \
  -x "node_modules/*" \
  -x ".git/*" \
  -x ".env*.local" \
  -x "__pycache__/*"

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Deployment package created: mudmy-deployment.zip"
  echo ""
  echo "📋 Next steps for Hostinger deployment:"
  echo "   1. Upload mudmy-deployment.zip to your Hostinger file manager"
  echo "   2. Extract the zip file"
  echo "   3. Go to the site dashboard and click 'Manage'"
  echo "   4. Create .env file with your Supabase credentials"
  echo "   5. Run 'npm install' in the terminal"
  echo "   6. Run 'npm start' or set up as Node.js application"
  echo ""
  echo "🎉 Ready to deploy!"
else
  echo "❌ Failed to create deployment package"
  exit 1
fi
