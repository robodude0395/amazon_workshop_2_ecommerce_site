#!/bin/bash
# Restart the chatbot service

echo "Restarting chatbot service..."
pm2 restart smiths-chatbot

echo "Waiting for service to start..."
sleep 3

echo "Checking service status..."
pm2 list | grep smiths-chatbot

echo ""
echo "Checking logs..."
pm2 logs smiths-chatbot --lines 20 --nostream
