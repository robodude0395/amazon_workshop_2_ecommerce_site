#!/bin/bash
# Update and rebuild the frontend with chat widget

set -e

echo "=========================================="
echo "Updating Frontend with Chat Widget"
echo "=========================================="
echo ""

# Navigate to frontend
cd frontend

echo "1. Installing dependencies (if needed)..."
npm install

echo ""
echo "2. Building production bundle..."
npm run build

echo ""
echo "3. Copying to web root..."
sudo cp -r build /var/www/smiths-detection/frontend/

echo ""
echo "4. Setting permissions..."
sudo chown -R www-data:www-data /var/www/smiths-detection/
sudo chmod -R 755 /var/www/smiths-detection/

echo ""
echo "5. Reloading Nginx..."
sudo nginx -t && sudo systemctl reload nginx

echo ""
echo "=========================================="
echo "Frontend Updated Successfully!"
echo "=========================================="
echo ""
echo "The chat widget should now appear in the bottom-right corner"
echo "of your website at http://localhost/"
echo ""
echo "Click the 💬 button to open the chat!"
