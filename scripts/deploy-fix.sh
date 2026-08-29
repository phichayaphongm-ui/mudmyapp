#!/bin/bash
# Hostinger Deployment Fix Script

echo "============================================"
echo " 🔧 Mudmy Deployment Fix Script for Hostinger"
echo "============================================"

# Fix Permissions
echo "⚙️ Fixing file permissions..."
chmod -R 755 .
chmod -R 777 public
chmod -R 777 .next 2>/dev/null || true
chmod -R 777 node_modules 2>/dev/null || true
echo "✅ Permissions fixed!"

# Cleanup old builds
echo "🧹 Cleaning up old builds..."
rm -rf .next
rm -rf node_modules
rm -f package-lock.json
echo "✅ Cleaned up!"

# Reinstall dependencies
echo "📦 Reinstalling dependencies..."
npm install

# Build the app
echo "🔨 Building application..."
npm run build

echo "============================================"
echo "✅ Deployment fix complete!"
echo "============================================"
echo ""
echo "Next steps:"
echo "1. Check if build succeeded"
echo "2. Run 'npm start' to start the server"
echo ""
