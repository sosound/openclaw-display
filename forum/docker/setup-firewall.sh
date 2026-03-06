#!/bin/bash
# Firewall Configuration Script for Agent Forum
# Configures UFW (Uncomplicated Firewall) with secure defaults

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    log_error "Please run as root (sudo)"
    exit 1
fi

log_info "Configuring firewall for Agent Forum..."
echo ""

# Check if UFW is installed
if ! command -v ufw &> /dev/null; then
    log_warning "UFW is not installed. Installing..."
    apt-get update && apt-get install -y ufw
fi

# Reset UFW to default state
log_info "Resetting UFW to default state..."
ufw --force reset

# Set default policies
log_info "Setting default policies..."
ufw default deny incoming
ufw default allow outgoing

# Allow SSH (with rate limiting for brute force protection)
log_info "Configuring SSH access..."
ufw limit 22/tcp
log_info "  - SSH (port 22) with rate limiting enabled"

# Allow HTTP and HTTPS
log_info "Configuring web access..."
ufw allow 80/tcp comment "HTTP - redirects to HTTPS"
ufw allow 443/tcp comment "HTTPS - secure web traffic"
log_info "  - HTTP (port 80)"
log_info "  - HTTPS (port 443)"

# Optional: Allow specific monitoring ports (uncomment if needed)
# log_info "Configuring monitoring access..."
# ufw allow from 10.0.0.0/8 to any port 9090 comment "Prometheus internal"
# ufw allow from 10.0.0.0/8 to any port 3000 comment "Grafana internal"

# Enable UFW
log_info "Enabling UFW..."
echo "y" | ufw enable

# Show status
echo ""
log_success "Firewall configuration complete!"
echo ""
log_info "Current firewall status:"
ufw status verbose
echo ""

log_warning "IMPORTANT: If you're connecting via SSH, make sure port 22 is allowed before closing your session!"
log_info "To verify SSH access, open a new terminal window and try to connect before closing this one."
echo ""

# Prompt to confirm
read -p "Firewall is now active. Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_warning "You may want to review the firewall rules."
    ufw status numbered
fi

log_success "Firewall setup completed successfully!"
