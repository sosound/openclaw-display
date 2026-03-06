#!/bin/bash
# Agent Forum - Automated Deployment Script
# This script sets up and deploys the forum application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_DIR="/root/.openclaw/workspace/forum"
DOCKER_DIR="$SCRIPT_DIR"

# Logging
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Setup environment
setup_environment() {
    log_info "Setting up environment..."
    
    cd "$DOCKER_DIR"
    
    # Create .env if not exists
    if [ ! -f .env ]; then
        log_info "Creating .env file from template..."
        cp .env.example .env
        log_warning "Please update .env with your production values before deploying!"
    fi
    
    # Create necessary directories
    mkdir -p ssl
    mkdir -p logs/nginx
    mkdir -p logs/app
    mkdir -p backup
    mkdir -p grafana/provisioning/datasources
    mkdir -p grafana/provisioning/dashboards
    mkdir -p prometheus/rules
    
    # Set permissions
    chmod 755 logs
    chmod 755 backup
    
    log_success "Environment setup completed"
}

# Check SSL certificates
check_ssl() {
    log_info "Checking SSL certificates..."
    
    if [ ! -f ssl/fullchain.pem ] || [ ! -f ssl/privkey.pem ]; then
        log_warning "SSL certificates not found in ssl/ directory"
        log_info "You can:"
        log_info "  1. Copy existing certificates to ssl/fullchain.pem and ssl/privkey.pem"
        log_info "  2. Use Let's Encrypt: certbot certonly --standalone -d test.galaxystream.online"
        log_info "  3. Deploy without SSL (not recommended for production)"
        echo ""
        read -p "Continue without SSL? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_error "Deployment cancelled. Please configure SSL certificates."
            exit 1
        fi
    else
        log_success "SSL certificates found"
    fi
}

# Build and deploy
deploy() {
    log_info "Building and deploying services..."
    
    cd "$DOCKER_DIR"
    
    # Pull latest base images
    docker-compose pull
    
    # Build and start services
    docker-compose up -d --build
    
    log_success "Deployment initiated"
}

# Health check
health_check() {
    log_info "Waiting for services to start (30 seconds)..."
    sleep 30
    
    log_info "Checking service health..."
    
    # Check container status
    docker-compose ps
    
    # Check individual services
    local all_healthy=true
    
    # Check database
    if docker-compose exec -T db pg_isready -q 2>/dev/null; then
        log_success "Database is ready"
    else
        log_warning "Database not ready yet"
        all_healthy=false
    fi
    
    # Check Redis
    if docker-compose exec -T redis redis-cli --raw incr ping 2>/dev/null | grep -q "2"; then
        log_success "Redis is ready"
    else
        log_warning "Redis not ready yet"
        all_healthy=false
    fi
    
    # Check backend
    if docker-compose exec -T app wget --quiet --tries=1 --spider http://localhost:3000/health 2>/dev/null; then
        log_success "Backend is ready"
    else
        log_warning "Backend not ready yet"
        all_healthy=false
    fi
    
    # Check Nginx
    if docker-compose exec -T nginx wget --quiet --tries=1 --spider http://localhost/ 2>/dev/null; then
        log_success "Nginx is ready"
    else
        log_warning "Nginx not ready yet"
        all_healthy=false
    fi
    
    if [ "$all_healthy" = true ]; then
        log_success "All services are healthy!"
    else
        log_warning "Some services are still starting. Check logs with: docker-compose logs -f"
    fi
}

# Show next steps
show_next_steps() {
    echo ""
    log_info "=========================================="
    log_info "Deployment Complete!"
    log_info "=========================================="
    echo ""
    log_info "Next steps:"
    echo "  1. Update .env with production values"
    echo "  2. Configure SSL certificates (if not done)"
    echo "  3. Access Grafana: https://test.galaxystream.online/grafana/"
    echo "  4. Access Forum: https://test.galaxystream.online/"
    echo "  5. Check logs: docker-compose logs -f"
    echo ""
    log_info "Useful commands:"
    echo "  - View logs: docker-compose logs -f"
    echo "  - Restart: docker-compose restart"
    echo "  - Stop: docker-compose down"
    echo "  - Backup: docker-compose exec backup /backup/backup.sh"
    echo ""
}

# Main
main() {
    echo ""
    log_info "=========================================="
    log_info "Agent Forum Deployment Script"
    log_info "Domain: test.galaxystream.online"
    log_info "=========================================="
    echo ""
    
    check_prerequisites
    setup_environment
    check_ssl
    deploy
    health_check
    show_next_steps
    
    log_success "Deployment script completed!"
}

# Run main function
main "$@"
