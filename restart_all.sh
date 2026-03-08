#!/bin/bash
# Restart all services for Smiths Detection E-Commerce Platform

set -e  # Exit on error

echo "=========================================="
echo "Restarting All Services"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# 1. Restart Backend (Node.js)
echo "1. Restarting Backend (Node.js)..."
if pm2 list | grep -q "smiths-backend"; then
    pm2 restart smiths-backend
    print_status "Backend restarted"
else
    print_warning "Backend not running in PM2, starting it..."
    cd backend
    pm2 start server.js --name smiths-backend
    cd ..
    print_status "Backend started"
fi
echo ""

# 2. Restart Chatbot (Python)
echo "2. Restarting Chatbot (Python)..."
if pm2 list | grep -q "smiths-chatbot"; then
    pm2 restart smiths-chatbot
    print_status "Chatbot restarted"
else
    print_warning "Chatbot not running in PM2, starting it..."
    cd chatbot
    pm2 start main.py --name smiths-chatbot --interpreter python3
    cd ..
    print_status "Chatbot started"
fi
echo ""

# 3. Reload Nginx
echo "3. Reloading Nginx..."
if command -v nginx &> /dev/null; then
    sudo nginx -t && sudo systemctl reload nginx
    print_status "Nginx reloaded"
else
    print_warning "Nginx not found, skipping..."
fi
echo ""

# 4. Wait for services to stabilize
echo "4. Waiting for services to stabilize..."
sleep 3
print_status "Services stabilized"
echo ""

# 5. Check service status
echo "=========================================="
echo "Service Status"
echo "=========================================="
echo ""

echo "PM2 Processes:"
pm2 list
echo ""

echo "Service Health Checks:"
echo ""

# Check Backend
echo -n "Backend (Port 5000): "
if curl -s http://localhost:5000/health > /dev/null 2>&1; then
    print_status "Healthy"
else
    print_error "Not responding"
fi

# Check Chatbot
echo -n "Chatbot (Port 8000): "
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    print_status "Healthy"
else
    print_error "Not responding"
fi

# Check Nginx
echo -n "Nginx (Port 80): "
if curl -s http://localhost/ > /dev/null 2>&1; then
    print_status "Healthy"
else
    print_error "Not responding"
fi

echo ""
echo "=========================================="
echo "Restart Complete!"
echo "=========================================="
echo ""
echo "View logs with:"
echo "  pm2 logs smiths-backend"
echo "  pm2 logs smiths-chatbot"
echo "  sudo tail -f /var/log/nginx/smiths-detection-access.log"
echo ""
echo "Test the system:"
echo "  curl http://localhost/api/products"
echo "  curl http://localhost/api/chat -X POST -H 'Content-Type: application/json' -d '{\"session_id\":\"test\",\"message\":\"Hello\"}'"
