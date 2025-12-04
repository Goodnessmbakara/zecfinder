#!/bin/bash

set -e

echo "🚀 ZecFinder Docker Setup Script"
echo "================================="
echo ""

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
    echo "❌ This script needs to be run with sudo privileges"
    echo "Please run: sudo bash install-and-start.sh"
    exit 1
fi

echo "📦 Step 1: Installing Docker..."
# Remove old versions if any
apt-get remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

# Install prerequisites
apt-get update
apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Add Docker's official GPG key
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

# Set up the repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

echo "✅ Docker installed successfully!"
echo ""

echo "👤 Step 2: Adding current user to docker group..."
# Get the original user (the one who ran sudo)
ORIGINAL_USER=${SUDO_USER:-$USER}
if [ "$ORIGINAL_USER" != "root" ]; then
    usermod -aG docker $ORIGINAL_USER
    echo "✅ User $ORIGINAL_USER added to docker group"
    echo "⚠️  Note: You may need to log out and back in for group changes to take effect"
else
    echo "⚠️  Running as root, skipping user group addition"
fi
echo ""

echo "📝 Step 3: Creating .env file..."
cd "$(dirname "$0")"
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ Created .env file from .env.example"
    else
        echo "⚠️  .env.example not found, creating basic .env file"
        cat > .env << EOF
# Google Gemini API Key
# Get your API key from: https://ai.google.dev/
GEMINI_API_KEY=AIzaSyCkXeHRldYkTO9DvNxM8DEIG3rkEyfsRYo

# Frontend URL (optional, defaults to http://localhost:5173)
FRONTEND_URL=http://localhost:5173
EOF
        echo "✅ Created basic .env file"
    fi
else
    echo "✅ .env file already exists"
fi
echo ""

echo "🐳 Step 4: Starting Docker services..."
# Use docker compose (v2) or docker-compose (v1)
if command -v docker &> /dev/null && docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
else
    echo "❌ Docker Compose not found!"
    exit 1
fi

echo "Starting Zcash testnet node (this may take a while)..."
$DOCKER_COMPOSE_CMD up -d zcash-testnet

echo ""
echo "✅ Setup complete!"
echo ""
echo "📊 Next steps:"
echo "1. Check Zcash node sync status:"
echo "   docker logs -f zcash-testnet"
echo ""
echo "2. Once synced (takes 30-60 minutes), start backend and frontend:"
echo "   docker compose up -d"
echo ""
echo "3. Check all services:"
echo "   docker compose ps"
echo ""
echo "4. View logs:"
echo "   docker compose logs -f"
echo ""
echo "🌐 Services will be available at:"
echo "   - Frontend: http://localhost:5173"
echo "   - Backend: http://localhost:3001"
echo "   - Zcash RPC: http://localhost:18232"
echo ""


