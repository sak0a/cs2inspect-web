#!/bin/bash

###########################################
# CS2Inspect Quick Install Script
#
# This script automates the installation
# of CS2Inspect on Ubuntu/Debian systems
###########################################

set -e

# ─── Shared Styling ──────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/style.sh"

# ─── Configuration ────────────────────────────────────────────────────────────

APP_DIR="$HOME/cs2inspect-web"
NODE_VERSION="20"

# ─── Pre-flight Checks ───────────────────────────────────────────────────────

check_os() {
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        OS=$ID
        VERSION=$VERSION_ID

        if [[ "$OS" != "ubuntu" ]] && [[ "$OS" != "debian" ]]; then
            print_error "This script only supports Ubuntu and Debian"
            exit 1
        fi

        print_success "Detected $OS $VERSION"
    else
        print_error "Cannot detect operating system"
        exit 1
    fi
}

check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_error "This script should not be run as root"
        print_info "Please run as a regular user with sudo privileges"
        exit 1
    fi
}

# ─── Installation Steps ──────────────────────────────────────────────────────

install_dependencies() {
    print_step "Installing system dependencies..."

    sudo apt update
    sudo apt install -y \
        curl \
        wget \
        git \
        build-essential \
        software-properties-common \
        ufw \
        fail2ban

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

    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
    sudo apt install -y nodejs

    print_success "Node.js $(node --version) installed"
}

install_bun() {
    print_step "Installing Bun..."

    if command -v bun &> /dev/null; then
        print_success "Bun $(bun --version) already installed"
        return
    fi

    curl -fsSL https://bun.sh/install | bash

    # Add bun to PATH
    export PATH="$HOME/.bun/bin:$PATH"
    echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc

    print_success "Bun $(bun --version) installed"
}

install_database() {
    print_step "Database setup"
    print_info "Do you want to install MariaDB on this server?"
    print_dim "(y) Yes, install MariaDB locally"
    print_dim "(n) No, I'll use an external database"
    read -p "Choice [y/n]: " choice

    if [[ "$choice" =~ ^[Yy]$ ]]; then
        print_step "Installing MariaDB..."
        sudo apt install -y mariadb-server mariadb-client
        sudo systemctl start mariadb
        sudo systemctl enable mariadb

        print_success "MariaDB installed"
        print_warning "Run 'sudo mysql_secure_installation' to secure your database"

        # Prompt for database setup
        print_info "Would you like to create the database now? [y/n]"
        read -p "Choice: " db_choice

        if [[ "$db_choice" =~ ^[Yy]$ ]]; then
            read -p "Enter database name [csinspect]: " DB_NAME
            DB_NAME=${DB_NAME:-csinspect}

            read -p "Enter database user [csinspect]: " DB_USER
            DB_USER=${DB_USER:-csinspect}

            read -sp "Enter database password: " DB_PASS
            echo

            sudo mysql -u root << EOF
CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
EOF

            print_success "Database created: $DB_NAME"
        fi
    else
        print_info "Skipping MariaDB installation"
    fi
}

clone_repository() {
    print_step "Cloning CS2Inspect repository..."

    if [[ -d "$APP_DIR" ]]; then
        print_warning "Directory $APP_DIR already exists"
        read -p "Do you want to remove it and clone fresh? [y/n]: " choice
        if [[ "$choice" =~ ^[Yy]$ ]]; then
            rm -rf "$APP_DIR"
        else
            print_info "Using existing directory"
            return
        fi
    fi

    git clone https://github.com/sak0a/cs2inspect-web.git "$APP_DIR"
    print_success "Repository cloned to $APP_DIR"
}

install_pm2() {
    print_step "Installing PM2 process manager..."

    if command -v pm2 &> /dev/null; then
        print_success "PM2 already installed"
        return
    fi

    sudo npm install -g pm2
    pm2 startup systemd -u $USER --hp $HOME
    sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME

    print_success "PM2 installed"
}

setup_environment() {
    print_step "Setting up environment configuration..."

    cd "$APP_DIR"

    if [[ ! -f .env ]]; then
        cp .env.example .env
        print_success ".env file created"

        # Generate JWT secret
        JWT_SECRET=$(openssl rand -hex 32)
        sed -i "s/JWT_TOKEN=.*/JWT_TOKEN=$JWT_SECRET/" .env

        print_info "Please edit .env file with your settings:"
        print_dim "nano $APP_DIR/.env"
    else
        print_warning ".env file already exists"
    fi
}

install_app_dependencies() {
    print_step "Installing application dependencies..."

    cd "$APP_DIR"
    bun install

    print_success "Dependencies installed"
}

build_application() {
    print_step "Building application..."

    cd "$APP_DIR"
    bun run build

    print_success "Application built successfully"
}

setup_firewall() {
    print_step "Firewall setup"
    print_info "Configure firewall? [y/n]"
    read -p "Choice: " choice

    if [[ "$choice" =~ ^[Yy]$ ]]; then
        sudo ufw allow 22/tcp
        sudo ufw allow 80/tcp
        sudo ufw allow 443/tcp
        sudo ufw --force enable

        print_success "Firewall configured"
    else
        print_info "Skipping firewall configuration"
    fi
}

# ─── Main ─────────────────────────────────────────────────────────────────────

main() {
    print_header "CS2Inspect Installation"

    check_root
    check_os

    echo ""
    print_info "This script will install:"
    print_dim "Node.js $NODE_VERSION"
    print_dim "Bun (JavaScript runtime)"
    print_dim "MariaDB (optional)"
    print_dim "PM2 process manager"
    print_dim "CS2Inspect application"
    echo ""
    read -p "Continue with installation? [y/n]: " confirm

    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        print_info "Installation cancelled"
        exit 0
    fi

    print_separator

    install_dependencies
    install_nodejs
    install_bun
    install_database
    clone_repository
    install_pm2
    setup_environment
    install_app_dependencies
    build_application
    setup_firewall

    print_done "Installation completed successfully!"
    print_elapsed
    echo ""
    print_info "Next steps:"
    print_dim "1. Configure environment:  nano $APP_DIR/.env"
    print_dim "2. Setup database:         cd $APP_DIR && bun run db:push"
    print_dim "3. Start application:      cd $APP_DIR && pm2 start ecosystem.config.js"
    print_dim "4. Save PM2 config:        pm2 save"
    print_dim "5. Access your app:        http://localhost:3000"
    echo ""
    print_info "Optional:"
    print_dim "Setup Nginx reverse proxy"
    print_dim "Configure SSL with Let's Encrypt"
    print_dim "Setup monitoring"
    echo ""
}

# Run main function
main "$@"
