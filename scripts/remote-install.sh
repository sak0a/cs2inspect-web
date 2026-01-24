#!/bin/bash

###########################################
# CS2Inspect Remote Installer
# 
# One-command installation via:
# curl -fsSL https://raw.githubusercontent.com/sak0a/cs2inspect-web/master/scripts/remote-install.sh | bash
###########################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
REPO_URL="https://github.com/sak0a/cs2inspect-web.git"
INSTALL_DIR="$HOME/cs2inspect-web"
NODE_VERSION="20"
INSTALLER_VERSION="1.0.0"

print_banner() {
    clear
    echo -e "${CYAN}"
    cat << "EOF"
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║       CS2Inspect Remote Installer v1.0.0             ║
║                                                       ║
║   One-command deployment for Counter-Strike 2        ║
║   weapon inspection and loadout management           ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_step() {
    echo -e "${CYAN}➜ $1${NC}"
}

check_os() {
    if [[ ! -f /etc/os-release ]]; then
        print_error "Cannot detect operating system"
        print_info "This installer supports: Ubuntu 20.04+, Debian 11+, CentOS 8+"
        exit 1
    fi
    
    . /etc/os-release
    OS=$ID
    VERSION=$VERSION_ID
    
    case $OS in
        ubuntu|debian)
            if [[ $VERSION_ID < "20" ]] && [[ $OS == "ubuntu" ]]; then
                print_warning "Ubuntu version might be too old. Recommended: 20.04+"
            fi
            ;;
        centos|rhel|fedora)
            print_info "Detected Red Hat-based system: $OS $VERSION"
            ;;
        *)
            print_warning "Unsupported OS: $OS"
            print_info "Installation may fail. Continue at your own risk."
            read -p "Continue anyway? [y/N]: " choice
            if [[ ! "$choice" =~ ^[Yy]$ ]]; then
                exit 1
            fi
            ;;
    esac
    
    print_success "Detected $OS $VERSION"
}

check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_error "Do not run this script as root"
        print_info "Run as regular user with sudo privileges"
        exit 1
    fi
    
    if ! sudo -n true 2>/dev/null; then
        print_info "This script requires sudo privileges"
        sudo -v
    fi
}

check_requirements() {
    print_step "Checking system requirements..."
    
    # Check available memory
    MEM_TOTAL=$(free -m | awk '/^Mem:/{print $2}')
    if [[ $MEM_TOTAL -lt 2048 ]]; then
        print_warning "Only ${MEM_TOTAL}MB RAM available. Recommended: 4GB+"
    else
        print_success "Memory: ${MEM_TOTAL}MB"
    fi
    
    # Check disk space
    DISK_AVAIL=$(df -BG / | awk 'NR==2 {print $4}' | sed 's/G//')
    if [[ $DISK_AVAIL -lt 10 ]]; then
        print_warning "Only ${DISK_AVAIL}GB disk space available. Recommended: 20GB+"
    else
        print_success "Disk space: ${DISK_AVAIL}GB available"
    fi
}

install_dependencies() {
    print_step "Installing system dependencies..."
    
    case $OS in
        ubuntu|debian)
            sudo apt update -qq
            sudo apt install -y curl wget git build-essential software-properties-common unzip
            ;;
        centos|rhel|fedora)
            sudo yum install -y curl wget git gcc gcc-c++ make unzip
            ;;
    esac
    
    print_success "System dependencies installed"
}

install_nodejs() {
    print_step "Installing Node.js $NODE_VERSION..."
    
    if command -v node &> /dev/null; then
        NODE_CURRENT=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [[ $NODE_CURRENT -ge $NODE_VERSION ]]; then
            print_success "Node.js $NODE_CURRENT already installed"
            return
        fi
    fi
    
    case $OS in
        ubuntu|debian)
            curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
            sudo apt install -y nodejs
            ;;
        centos|rhel|fedora)
            curl -fsSL https://rpm.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
            sudo yum install -y nodejs
            ;;
    esac
    
    print_success "Node.js $(node --version) installed"
}

install_bun() {
    print_step "Installing Bun..."
    
    if command -v bun &> /dev/null; then
        print_success "Bun already installed: $(bun --version)"
        return
    fi
    
    curl -fsSL https://bun.sh/install | bash
    
    # Add bun to PATH for current session
    export PATH="$HOME/.bun/bin:$PATH"
    
    # Add to shell profile
    if [[ -f ~/.bashrc ]]; then
        if ! grep -q '.bun/bin' ~/.bashrc; then
            echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc
        fi
    fi
    
    if [[ -f ~/.zshrc ]]; then
        if ! grep -q '.bun/bin' ~/.zshrc; then
            echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.zshrc
        fi
    fi
    
    print_success "Bun $(bun --version) installed"
}

install_database() {
    print_step "Setting up database..."
    echo ""
    print_info "Database options:"
    echo "  1) Install MariaDB locally (recommended for single server)"
    echo "  2) Use external database (for distributed setup)"
    echo "  3) Skip (configure later)"
    echo ""
    read -p "Choose option [1-3]: " db_choice
    
    case $db_choice in
        1)
            install_mariadb
            ;;
        2)
            print_info "You'll need to configure DATABASE_* variables manually"
            SKIP_DB=true
            ;;
        3)
            print_warning "Database skipped. Configure before starting application."
            SKIP_DB=true
            ;;
        *)
            print_error "Invalid choice"
            exit 1
            ;;
    esac
}

install_mariadb() {
    print_step "Installing MariaDB..."
    
    case $OS in
        ubuntu|debian)
            sudo apt install -y mariadb-server mariadb-client
            ;;
        centos|rhel|fedora)
            sudo yum install -y mariadb-server mariadb
            ;;
    esac
    
    sudo systemctl start mariadb
    sudo systemctl enable mariadb
    
    print_success "MariaDB installed"
    
    # Create database
    read -p "Create database now? [Y/n]: " create_db
    if [[ ! "$create_db" =~ ^[Nn]$ ]]; then
        DB_NAME="csinspect"
        DB_USER="csinspect"
        DB_PASS=$(openssl rand -base64 16)
        
        sudo mysql -u root << EOF
CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
EOF
        
        print_success "Database created: $DB_NAME"
        print_info "Username: $DB_USER"
        print_info "Password: $DB_PASS (saved to $INSTALL_DIR/.db-credentials)"
        
        # Save credentials
        mkdir -p "$INSTALL_DIR"
        cat > "$INSTALL_DIR/.db-credentials" << EOF
DATABASE_NAME=$DB_NAME
DATABASE_USER=$DB_USER
DATABASE_PASSWORD=$DB_PASS
DATABASE_HOST=localhost
DATABASE_PORT=3306
EOF
        chmod 600 "$INSTALL_DIR/.db-credentials"
    fi
}

clone_repository() {
    print_step "Cloning CS2Inspect repository..."
    
    if [[ -d "$INSTALL_DIR" ]]; then
        print_warning "Directory $INSTALL_DIR already exists"
        read -p "Remove and clone fresh? [y/N]: " choice
        if [[ "$choice" =~ ^[Yy]$ ]]; then
            rm -rf "$INSTALL_DIR"
        else
            print_info "Using existing directory"
            cd "$INSTALL_DIR"
            git pull origin master
            return
        fi
    fi
    
    git clone "$REPO_URL" "$INSTALL_DIR"
    print_success "Repository cloned"
}

install_app() {
    print_step "Installing application dependencies..."
    
    cd "$INSTALL_DIR"
    bun install
    
    print_success "Dependencies installed"
}

configure_env() {
    print_step "Configuring environment..."
    
    cd "$INSTALL_DIR"
    
    if [[ ! -f .env ]]; then
        cp .env.example .env
        
        # Generate secure secrets
        JWT_SECRET=$(openssl rand -hex 32)
        sed -i "s/JWT_TOKEN=.*/JWT_TOKEN=$JWT_SECRET/" .env
        
        # Load database credentials if available
        if [[ -f .db-credentials ]]; then
            . .db-credentials
            sed -i "s/DATABASE_HOST=.*/DATABASE_HOST=$DATABASE_HOST/" .env
            sed -i "s/DATABASE_PORT=.*/DATABASE_PORT=$DATABASE_PORT/" .env
            sed -i "s/DATABASE_USER=.*/DATABASE_USER=$DATABASE_USER/" .env
            sed -i "s/DATABASE_PASSWORD=.*/DATABASE_PASSWORD=$DATABASE_PASSWORD/" .env
            sed -i "s/DATABASE_NAME=.*/DATABASE_NAME=$DATABASE_NAME/" .env
        fi
        
        print_success "Environment configured"
        print_warning "IMPORTANT: Edit .env file with your Steam API key and other settings"
        print_info "Get Steam API key: https://steamcommunity.com/dev/apikey"
    else
        print_info ".env file already exists"
    fi
}

build_app() {
    print_step "Building application..."
    
    cd "$INSTALL_DIR"
    bun run build
    
    print_success "Application built"
}

setup_service() {
    print_step "Setting up systemd service..."
    
    read -p "Setup as systemd service? [Y/n]: " choice
    if [[ "$choice" =~ ^[Nn]$ ]]; then
        print_info "Skipping service setup"
        return
    fi
    
    sudo tee /etc/systemd/system/cs2inspect.service > /dev/null << EOF
[Unit]
Description=CS2Inspect Web Application
After=network.target mariadb.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$INSTALL_DIR
ExecStart=$(which bun) run .output/server/index.mjs
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=cs2inspect

Environment=NODE_ENV=production
EnvironmentFile=$INSTALL_DIR/.env

[Install]
WantedBy=multi-user.target
EOF
    
    sudo systemctl daemon-reload
    sudo systemctl enable cs2inspect
    
    print_success "Systemd service configured"
    print_info "Start with: sudo systemctl start cs2inspect"
}

setup_firewall() {
    print_step "Configuring firewall..."
    
    read -p "Configure firewall? [Y/n]: " choice
    if [[ "$choice" =~ ^[Nn]$ ]]; then
        return
    fi
    
    if command -v ufw &> /dev/null; then
        sudo ufw allow 22/tcp
        sudo ufw allow 80/tcp
        sudo ufw allow 443/tcp
        sudo ufw allow 3000/tcp
        sudo ufw --force enable
        print_success "UFW firewall configured"
    elif command -v firewall-cmd &> /dev/null; then
        sudo firewall-cmd --permanent --add-service=ssh
        sudo firewall-cmd --permanent --add-service=http
        sudo firewall-cmd --permanent --add-service=https
        sudo firewall-cmd --permanent --add-port=3000/tcp
        sudo firewall-cmd --reload
        print_success "Firewalld configured"
    else
        print_warning "No firewall detected"
    fi
}

print_completion() {
    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                   ║${NC}"
    echo -e "${GREEN}║   Installation completed successfully! 🎉        ║${NC}"
    echo -e "${GREEN}║                                                   ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BLUE}📍 Installation Directory:${NC} $INSTALL_DIR"
    echo ""
    echo -e "${BLUE}🔧 Next Steps:${NC}"
    echo ""
    echo "1. Configure environment:"
    echo -e "   ${YELLOW}nano $INSTALL_DIR/.env${NC}"
    echo "   - Add your Steam API key"
    echo "   - Configure other settings"
    echo ""
    echo "2. Initialize database:"
    echo -e "   ${YELLOW}cd $INSTALL_DIR && bun run db:push${NC}"
    echo ""
    
    if [[ -f /etc/systemd/system/cs2inspect.service ]]; then
        echo "3. Start service:"
        echo -e "   ${YELLOW}sudo systemctl start cs2inspect${NC}"
        echo ""
        echo "4. Check status:"
        echo -e "   ${YELLOW}sudo systemctl status cs2inspect${NC}"
        echo ""
        echo "5. View logs:"
        echo -e "   ${YELLOW}sudo journalctl -u cs2inspect -f${NC}"
    else
        echo "3. Start application:"
        echo -e "   ${YELLOW}cd $INSTALL_DIR && bun run preview${NC}"
        echo ""
        echo "   Or with PM2:"
        echo -e "   ${YELLOW}bun add -g pm2${NC}"
        echo -e "   ${YELLOW}pm2 start ecosystem.config.js${NC}"
    fi
    
    echo ""
    echo -e "${BLUE}📚 Documentation:${NC}"
    echo "   • Self-hosting guide: $INSTALL_DIR/docs/SELF_HOSTING.md"
    echo "   • Setup guide: $INSTALL_DIR/docs/setup.md"
    echo "   • Online docs: https://github.com/sak0a/cs2inspect-web"
    echo ""
    echo -e "${BLUE}🌐 Access:${NC}"
    echo "   • Local: http://localhost:3000"
    echo "   • Public: http://$(hostname -I | awk '{print $1}'):3000"
    echo ""
    echo -e "${BLUE}💡 Tips:${NC}"
    echo "   • Use 'make help' for available commands"
    echo "   • Run './scripts/validate-env.sh' to check configuration"
    echo "   • Setup Nginx reverse proxy for production"
    echo ""
    echo -e "${GREEN}Thank you for using CS2Inspect! 🎮${NC}"
    echo ""
}

# Main installation flow
main() {
    print_banner
    
    echo -e "${BLUE}This installer will:${NC}"
    echo "  ✓ Install Node.js and Bun"
    echo "  ✓ Install MariaDB (optional)"
    echo "  ✓ Clone CS2Inspect repository"
    echo "  ✓ Install dependencies"
    echo "  ✓ Configure environment"
    echo "  ✓ Build application"
    echo "  ✓ Setup systemd service (optional)"
    echo "  ✓ Configure firewall (optional)"
    echo ""
    print_warning "Installation will take 5-10 minutes"
    echo ""
    read -p "Continue? [Y/n]: " confirm
    
    if [[ "$confirm" =~ ^[Nn]$ ]]; then
        print_info "Installation cancelled"
        exit 0
    fi
    
    echo ""
    
    check_root
    check_os
    check_requirements
    
    install_dependencies
    install_nodejs
    install_bun
    install_database
    clone_repository
    install_app
    configure_env
    build_app
    setup_service
    setup_firewall
    
    print_completion
}

# Trap errors
trap 'print_error "Installation failed at step: $BASH_COMMAND"' ERR

# Run installation
main "$@"
