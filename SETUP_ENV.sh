#!/bin/bash
# Quick setup script for GEMINI_API_KEY

echo "🔐 Setting up GEMINI_API_KEY securely..."
echo ""

# Check if .env exists
if [ -f .env ]; then
    echo "⚠️  .env file already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Keeping existing .env file."
        exit 0
    fi
fi

# Get API key from user
echo "Enter your Gemini API key (get it from https://ai.google.dev/):"
read -s GEMINI_KEY

if [ -z "$GEMINI_KEY" ]; then
    echo "❌ API key cannot be empty!"
    exit 1
fi

# Create .env file
cat > .env << ENVFILE
# Google Gemini API Key
# Get your API key from: https://ai.google.dev/
GEMINI_API_KEY=$GEMINI_KEY

# Frontend URL (optional, defaults to http://localhost:5173)
FRONTEND_URL=http://localhost:5173
ENVFILE

# Set permissions (readable only by owner)
chmod 600 .env

echo ""
echo "✅ .env file created successfully!"
echo "✅ File permissions set to 600 (readable only by you)"
echo ""
echo "You can now run: docker-compose up -d"
