#!/bin/bash

echo "🔄 Restarting V2V service with fixes..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_status "Rebuilding and restarting web container..."

# Stop and rebuild the web container
docker-compose stop web
docker-compose build web
docker-compose up -d web

print_status "Waiting for service to start..."
sleep 5

# Check if service is running
if docker-compose ps | grep "web" | grep "Up" > /dev/null; then
    print_status "✅ Web service is running"
else
    print_warning "❌ Web service might have issues. Check logs:"
    echo "docker-compose logs web"
    exit 1
fi

print_status "🧪 Testing V2V health endpoint..."
sleep 2

# Test health endpoint
if curl -s http://localhost:8000/v2v/health > /dev/null; then
    print_status "✅ V2V health endpoint is responding"
    echo ""
    echo "🔗 V2V Health Check: http://localhost:8000/v2v/health"
    echo "🔌 WebSocket Endpoint: ws://localhost:8000/v2v/ws/video-chat"
    echo ""
    print_status "🎉 V2V service should now work better!"
    echo ""
    print_warning "📝 Changes made:"
    echo "   - Reduced frame processing interval from 10 to 3"
    echo "   - Improved logging for debugging"
    echo "   - Better error handling"
else
    print_warning "❌ V2V health endpoint not responding"
    echo "Check logs: docker-compose logs web"
fi

echo ""
print_status "📊 To monitor logs in real-time:"
echo "docker-compose logs -f web | grep -i v2v" 