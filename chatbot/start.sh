#!/bin/bash

# Startup script for Shopping Assistant Chatbot Service
# This script loads environment variables and starts the uvicorn server

# Exit on error
set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Change to the chatbot directory
cd "$SCRIPT_DIR"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file not found in $SCRIPT_DIR"
    echo "Please create a .env file based on .env.example"
    exit 1
fi

# Load environment variables from .env file
echo "Loading environment variables from .env..."
set -a
source .env
set +a

# Validate required environment variables
REQUIRED_VARS=(
    "AWS_ACCESS_KEY_ID"
    "AWS_SECRET_ACCESS_KEY"
    "BACKEND_API_URL"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "Error: Required environment variable $var is not set"
        exit 1
    fi
done

# Set default values for optional variables
export CHATBOT_PORT="${CHATBOT_PORT:-8000}"
export CHATBOT_HOST="${CHATBOT_HOST:-0.0.0.0}"
export LOG_LEVEL="${LOG_LEVEL:-INFO}"

echo "Starting Shopping Assistant Chatbot Service..."
echo "  Host: $CHATBOT_HOST"
echo "  Port: $CHATBOT_PORT"
echo "  Backend API: $BACKEND_API_URL"
echo "  Log Level: $LOG_LEVEL"

# Start uvicorn server
python -m uvicorn main:app --host "$CHATBOT_HOST" --port "$CHATBOT_PORT"
