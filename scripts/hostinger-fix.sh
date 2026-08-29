#!/bin/bash
echo "🔧 Fixing permissions for Hostinger..."

# Fix directory permissions
chmod -R 755 .
find . -type d -exec chmod 755 {} \;
find . -type f -exec chmod 644 {} \;

# Fix specific directories
chmod -R 777 app components lib public contexts hooks styles 2>/dev/null || true

echo "✅ Permissions fixed!"
echo ""
echo "Now run:"
echo "  npm install"
echo "  npm run build"
echo "  npm start"
