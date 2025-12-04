#!/bin/bash

echo "🔧 Fixing Docker permissions..."
echo ""

# Add user to docker group
sudo usermod -aG docker $USER

echo "✅ User added to docker group"
echo ""
echo "⚠️  IMPORTANT: You need to either:"
echo "   1. Log out and log back in, OR"
echo "   2. Run: newgrp docker"
echo ""
echo "After that, you can run docker commands without sudo."
echo ""
echo "To activate the group change in this session, run:"
echo "   newgrp docker"


