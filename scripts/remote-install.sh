#!/bin/bash

###########################################
# CS2Inspect Remote Installer
#
# One-command installation via:
# curl -fsSL https://raw.githubusercontent.com/sak0a/cs2inspect-web/master/scripts/remote-install.sh | bash
###########################################

set -e

# ─── Styling Helpers ────────────────────────────────────────────────────────
# NOTE: Helpers duplicated from scripts/lib/style.sh (this script runs via curl pipe)

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
DIM='\033[2m'
BOLD='\033[1m'
NC='\033[0m'

_start_time=$(date +%s)

print_step() {
    echo -e "${CYAN}-->  ${1}${NC}"
}

print_success() {
    echo -e "${GREEN}✓  ${1}${NC}"
}

print_error() {
    echo -e "${RED}✗  ${1}${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠  ${1}${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ  ${1}${NC}"
}

print_dim() {
    echo -e "${DIM}   ${1}${NC}"
}

print_header() {
    local title="$1"
    local title_len=${#title}
    local width=$((title_len + 4))
    if [ "$width" -lt 40 ]; then
        width=40
    fi
    local padding=$((width - title_len - 2))

    echo ""
    printf "${CYAN}┌"
    printf '─%.0s' $(seq 1 "$width")
    printf "┐${NC}\n"
    printf "${CYAN}│${NC} ${BOLD}%s${NC}" "$title"
    printf '%*s' "$padding" ""
    printf "${CYAN}│${NC}\n"
    printf "${CYAN}└"
    printf '─%.0s' $(seq 1 "$width")
    printf "┘${NC}\n"
    echo ""
}

print_done() {
    local msg="${1:-Done!}"
    echo ""
    echo -e "${GREEN}${BOLD}✓  ${msg}${NC}"
    echo ""
}

print_separator() {
    echo -e "${DIM}$(printf '─%.0s' $(seq 1 50))${NC}"
}

print_elapsed() {
    local end_time
    end_time=$(date +%s)
    local elapsed=$(( end_time - _start_time ))

    if [ "$elapsed" -ge 60 ]; then
        local mins=$(( elapsed / 60 ))
        local secs=$(( elapsed % 60 ))
        echo -e "${DIM}Completed in ${mins}m ${secs}s${NC}"
    else
        echo -e "${DIM}Completed in ${elapsed}s${NC}"
    fi
}

# ─── Configuration ────────────────────────────────────────────────────────────

REPO_URL="https://github.com/sak0a/cs2inspect-web.git"
INSTALL_DIR="$HOME/cs2inspect-web"
NODE_VERSION="20"
INSTALLER_VERSION="1.0.0"

# ─── Pre-flight Checks ───────────────────────────────────────────────────────

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

# ─── Installation Steps ──────────────────────────────────────────────────────

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
    print_step "Database setup"
    echo ""
    print_info "Database options:"
    print_dim "(1) Install MariaDB locally (recommended for single server)"
    print_dim "(2) Use external database (for distributed setup)"
    print_dim "(3) Skip (configure later)"
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
    print_step "Systemd service setup"

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
    print_dim "Start with: sudo systemctl start cs2inspect"
}

setup_firewall() {
    print_step "Firewall setup"

    read -p "Configure firewall? [Y/n]: " choice
    if [[ "$choice" =~ ^[Nn]$ ]]; then
        print_info "Skipping firewall configuration"
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

# ─── Main ─────────────────────────────────────────────────────────────────────

main() {
    print_header "CS2Inspect Remote Installer v$INSTALLER_VERSION"

    print_info "This installer will:"
    print_dim "Node.js $NODE_VERSION"
    print_dim "Bun (JavaScript runtime)"
    print_dim "MariaDB (optional)"
    print_dim "CS2Inspect application"
    print_dim "Systemd service (optional)"
    print_dim "Firewall configuration (optional)"
    echo ""
    print_warning "Installation will take 5-10 minutes"
    echo ""
    read -p "Continue? [Y/n]: " confirm

    if [[ "$confirm" =~ ^[Nn]$ ]]; then
        print_info "Installation cancelled"
        exit 0
    fi

    print_separator

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

    print_done "Installation completed successfully!"
    print_elapsed
    echo ""
    print_info "Installation directory: $INSTALL_DIR"
    echo ""
    print_info "Next steps:"
    print_dim "1. Configure environment:  nano $INSTALL_DIR/.env"
    print_dim "   - Add your Steam API key"
    print_dim "   - Review other settings"
    echo ""
    print_dim "2. Initialize database:    cd $INSTALL_DIR && bun run db:push"
    echo ""

    if [[ -f /etc/systemd/system/cs2inspect.service ]]; then
        print_dim "3. Start service:          sudo systemctl start cs2inspect"
        print_dim "4. Check status:           sudo systemctl status cs2inspect"
        print_dim "5. View logs:              sudo journalctl -u cs2inspect -f"
    else
        print_dim "3. Start application:      cd $INSTALL_DIR && bun run preview"
        echo ""
        print_dim "   Or with PM2:"
        print_dim "   bun add -g pm2"
        print_dim "   pm2 start ecosystem.config.js"
    fi

    echo ""
    print_info "Documentation:"
    print_dim "Self-hosting guide: $INSTALL_DIR/docs/SELF_HOSTING.md"
    print_dim "Online docs:        https://github.com/sak0a/cs2inspect-web"
    echo ""
    print_info "Access:"
    print_dim "Local:  http://localhost:3000"
    print_dim "Public: http://$(hostname -I | awk '{print $1}'):3000"
    echo ""
    print_info "Tips:"
    print_dim "Run 'bun run cli validate' to check configuration"
    print_dim "Setup Nginx reverse proxy for production"
    echo ""
}

# Trap errors
trap 'print_error "Installation failed at step: $BASH_COMMAND"' ERR

# Run installation
main "$@"
