#!/bin/bash

# Local development script for uptime webhook
set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$SCRIPT_DIR"

# Default command
COMMAND=${1:-help}

case $COMMAND in
  "start")
    echo "🚀 Starting uptime webhook in development mode..."
    
    # Create .env if it doesn't exist
    if [ ! -f .env ]; then
      echo "📝 Creating .env file from example..."
      cp .env.example .env
      echo "✏️ Edit .env file with your configuration"
    fi
    
    # Install dependencies if needed
    if [ ! -d node_modules ]; then
      echo "📦 Installing dependencies..."
      npm install
    fi
    
    # Start the development server
    npm run dev
    ;;
    
  "test")
    echo "🧪 Running webhook tests..."
    
    # Set up environment for testing
    export WEBHOOK_URL="http://localhost:8080/webhook/uptime"
    export WEBHOOK_TOKEN="local-dev-token"
    
    # Wait for service to be ready
    echo "⏳ Waiting for webhook service to be ready..."
    timeout 30 bash -c 'until curl -f http://localhost:8080/health; do sleep 1; done' || {
      echo "❌ Webhook service not ready after 30 seconds"
      exit 1
    }
    
    echo "✅ Service is ready, running tests..."
    node test/test-webhook.js
    ;;
    
  "docker")
    echo "🐳 Starting with Docker Compose..."
    docker-compose up --build
    ;;
    
  "docker-test")
    echo "🐳 Testing with Docker Compose..."
    
    # Start services in background
    docker-compose up -d --build
    
    # Wait for services to be ready
    echo "⏳ Waiting for services to be ready..."
    sleep 10
    
    # Run tests
    export WEBHOOK_URL="http://localhost:8080/webhook/uptime"
    export WEBHOOK_TOKEN="local-dev-token"
    node test/test-webhook.js
    
    # Clean up
    docker-compose down
    ;;
    
  "gcs-list")
    echo "📋 Listing GCS uptime alerts..."
    node test/gcs-reader.js list
    ;;
    
  "gcs-process")
    echo "🎲 Processing GCS alerts with random service assignment..."
    node test/gcs-reader.js process
    ;;
    
  "services")
    echo "📋 Listing available services..."
    node test/gcs-reader.js services
    ;;
    
  "install")
    echo "📦 Installing dependencies..."
    npm install
    ;;
    
  "build")
    echo "🔨 Building Docker image..."
    docker build -t cork-uptime-webhook .
    ;;
    
  "clean")
    echo "🧹 Cleaning up..."
    docker-compose down -v
    docker rmi cork-uptime-webhook 2>/dev/null || true
    rm -rf node_modules
    ;;
    
  "logs")
    echo "📜 Showing webhook logs..."
    docker-compose logs -f uptime-webhook
    ;;
    
  "help"|*)
    echo "🔧 Cork Uptime Webhook - Local Development"
    echo ""
    echo "Usage: ./dev.sh <command>"
    echo ""
    echo "Commands:"
    echo "  start        - Start webhook in development mode (local Node.js)"
    echo "  test         - Run webhook tests against local service"
    echo "  docker       - Start with Docker Compose"
    echo "  docker-test  - Test with Docker Compose"
    echo "  gcs-list     - List uptime alerts in GCS bucket"
    echo "  gcs-process  - Process GCS alerts and assign to random services"
    echo "  services     - List available services in database"
    echo "  install      - Install dependencies"
    echo "  build        - Build Docker image"
    echo "  clean        - Clean up Docker containers and images"
    echo "  logs         - Show Docker container logs"
    echo "  help         - Show this help"
    echo ""
    echo "Environment Setup:"
    echo "1. Copy .env.example to .env"
    echo "2. Update .env with your configuration"
    echo "3. Ensure the main cork-service-status app is running (for PostgREST)"
    echo ""
    echo "Quick Start:"
    echo "  ./dev.sh install"
    echo "  ./dev.sh start"
    echo ""
    echo "In another terminal:"
    echo "  ./dev.sh test"
    ;;
esac