#!/bin/bash

echo "🚀 Deploying AuarAI with WebSocket support..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

# Check if nginx is installed
if ! command -v nginx &> /dev/null; then
    print_error "nginx is not installed. Please install nginx first:"
    echo "  Ubuntu/Debian: sudo apt update && sudo apt install nginx"
    echo "  CentOS/RHEL: sudo yum install nginx"
    echo "  macOS: brew install nginx"
    exit 1
fi

# Check if systemctl is available (Linux)
if command -v systemctl &> /dev/null; then
    SYSTEMCTL_AVAILABLE=true
else
    SYSTEMCTL_AVAILABLE=false
fi

print_status "Building frontend..."
cd frontend/web
npm install
npm run build
cd ../..

print_status "Setting up backend dependencies..."
pip install -r requirements.txt

print_status "Setting up nginx configuration..."

# Backup existing nginx config if it exists
NGINX_CONF="/etc/nginx/sites-available/auarai"
NGINX_ENABLED="/etc/nginx/sites-enabled/auarai"

if [ -f "$NGINX_CONF" ]; then
    print_warning "Backing up existing nginx configuration..."
    sudo cp "$NGINX_CONF" "$NGINX_CONF.backup.$(date +%Y%m%d_%H%M%S)"
fi

# Copy our nginx config
print_status "Installing nginx configuration..."
sudo cp nginx/auarai.conf "$NGINX_CONF"

# Enable the site
if [ ! -L "$NGINX_ENABLED" ]; then
    sudo ln -s "$NGINX_CONF" "$NGINX_ENABLED"
fi

# Remove default nginx site if it exists
if [ -L "/etc/nginx/sites-enabled/default" ]; then
    print_status "Removing default nginx site..."
    sudo rm /etc/nginx/sites-enabled/default
fi

# Test nginx configuration
print_status "Testing nginx configuration..."
if sudo nginx -t; then
    print_status "Nginx configuration is valid"
else
    print_error "Nginx configuration test failed"
    exit 1
fi

# Create frontend directory
print_status "Setting up frontend files..."
sudo mkdir -p /var/www/auarai/frontend
sudo cp -r frontend/web/dist/* /var/www/auarai/frontend/
sudo chown -R www-data:www-data /var/www/auarai/

# Restart nginx
if [ "$SYSTEMCTL_AVAILABLE" = true ]; then
    print_status "Restarting nginx..."
    sudo systemctl restart nginx
    sudo systemctl enable nginx
else
    print_warning "systemctl not available. Please restart nginx manually:"
    echo "  sudo nginx -s reload"
fi

print_status "Starting FastAPI backend..."
echo "Starting backend on port 8000..."

# Kill any existing backend process
pkill -f "uvicorn.*main:app" || true

# Start backend in background
nohup python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > backend.log 2>&1 &
BACKEND_PID=$!

print_status "Backend started with PID: $BACKEND_PID"

# Wait a moment for backend to start
sleep 3

# Check if backend is running
if ps -p $BACKEND_PID > /dev/null; then
    print_status "Backend is running successfully"
else
    print_error "Backend failed to start. Check backend.log for details"
    exit 1
fi

print_status "✅ Deployment completed!"
echo ""
echo "🌐 Your application should now be available at:"
echo "   - Local: http://localhost:8080"
echo "   - Production: https://auarai.com (if DNS is configured)"
echo ""
echo "📊 Backend API: http://localhost:8000"
echo "🔌 WebSocket: ws://localhost:8000/v2v/ws/video-chat (local)"
echo "🔒 WebSocket: wss://auarai.com/api/v2v/ws/video-chat (production)"
echo ""
echo "📝 Logs:"
echo "   - Backend: ./backend.log"
echo "   - Nginx: /var/log/nginx/auarai_*.log"
echo ""
print_warning "⚠️  For production, make sure to:"
echo "   1. Configure SSL certificates in nginx/auarai.conf"
echo "   2. Update DNS to point to your server"
echo "   3. Configure firewall (ports 80, 443, 8000)"
echo "   4. Set up proper logging and monitoring"
echo ""
print_status "🎉 Happy styling with AuarAI!" 