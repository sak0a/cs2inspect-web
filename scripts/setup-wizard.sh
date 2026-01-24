#!/bin/bash

###########################################
# CS2Inspect Setup Wizard
# 
# Interactive configuration wizard for
# setting up CS2Inspect environment
###########################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration file
ENV_FILE=".env"

print_header() {
    clear
    echo -e "${CYAN}"
    cat << "EOF"
╔═══════════════════════════════════════════════════╗
║                                                   ║
║          CS2Inspect Configuration Wizard          ║
║                                                   ║
║  This wizard will help you configure CS2Inspect   ║
║  with all required settings and credentials.      ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

prompt_with_default() {
    local prompt="$1"
    local default="$2"
    local value
    
    if [[ -n "$default" ]]; then
        read -p "$prompt [$default]: " value
        echo "${value:-$default}"
    else
        read -p "$prompt: " value
        echo "$value"
    fi
}

prompt_password() {
    local prompt="$1"
    local value
    
    read -sp "$prompt: " value
    echo
    echo "$value"
}

generate_secret() {
    openssl rand -hex 32
}

validate_steam_api_key() {
    local key="$1"
    if [[ ${#key} -ne 32 ]]; then
        return 1
    fi
    return 0
}

# Step 1: Server Configuration
configure_server() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════${NC}"
    echo -e "${CYAN}  Step 1: Server Configuration${NC}"
    echo -e "${CYAN}═══════════════════════════════════════${NC}"
    echo ""
    
    print_info "Configure the server settings for CS2Inspect."
    echo ""
    
    PORT=$(prompt_with_default "Server port" "3000")
    HOST=$(prompt_with_default "Server host" "0.0.0.0")
    NODE_ENV=$(prompt_with_default "Environment (development/production)" "production")
    
    print_success "Server configuration completed"
}

# Step 2: JWT Configuration
configure_jwt() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════${NC}"
    echo -e "${CYAN}  Step 2: JWT Configuration${NC}"
    echo -e "${CYAN}═══════════════════════════════════════${NC}"
    echo ""
    
    print_info "JWT tokens are used for API authentication."
    echo ""
    
    read -p "Generate secure JWT secret automatically? [Y/n]: " auto_jwt
    
    if [[ "$auto_jwt" =~ ^[Nn]$ ]]; then
        JWT_TOKEN=$(prompt_with_default "JWT secret (min 32 chars)" "")
        while [[ ${#JWT_TOKEN} -lt 32 ]]; do
            print_warning "JWT secret must be at least 32 characters"
            JWT_TOKEN=$(prompt_with_default "JWT secret (min 32 chars)" "")
        done
    else
        JWT_TOKEN=$(generate_secret)
        print_success "Generated secure JWT secret"
    fi
    
    JWT_EXPIRY=$(prompt_with_default "JWT expiry time" "7d")
    
    print_success "JWT configuration completed"
}

# Step 3: Database Configuration
configure_database() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════${NC}"
    echo -e "${CYAN}  Step 3: Database Configuration${NC}"
    echo -e "${CYAN}═══════════════════════════════════════${NC}"
    echo ""
    
    print_info "Configure your MariaDB/MySQL database connection."
    echo ""
    
    DATABASE_HOST=$(prompt_with_default "Database host" "localhost")
    DATABASE_PORT=$(prompt_with_default "Database port" "3306")
    DATABASE_NAME=$(prompt_with_default "Database name" "csinspect")
    DATABASE_USER=$(prompt_with_default "Database user" "csinspect")
    DATABASE_PASSWORD=$(prompt_password "Database password")
    DATABASE_CONNECTION_LIMIT=$(prompt_with_default "Connection pool limit" "10")
    
    # Test database connection
    echo ""
    print_info "Testing database connection..."
    
    if command -v mysql &> /dev/null; then
        if mysql -h"$DATABASE_HOST" -P"$DATABASE_PORT" -u"$DATABASE_USER" -p"$DATABASE_PASSWORD" -e "USE $DATABASE_NAME" 2>/dev/null; then
            print_success "Database connection successful!"
        else
            print_warning "Database connection failed. Please verify credentials."
            read -p "Continue anyway? [y/N]: " continue_db
            if [[ ! "$continue_db" =~ ^[Yy]$ ]]; then
                configure_database
                return
            fi
        fi
    else
        print_warning "MySQL client not found. Skipping connection test."
    fi
    
    print_success "Database configuration completed"
}

# Step 4: Steam API Configuration
configure_steam_api() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════${NC}"
    echo -e "${CYAN}  Step 4: Steam API Configuration${NC}"
    echo -e "${CYAN}═══════════════════════════════════════${NC}"
    echo ""
    
    print_info "Steam API key is required for authentication and user data."
    echo ""
    print_info "Get your API key from: https://steamcommunity.com/dev/apikey"
    echo ""
    
    STEAM_API_KEY=$(prompt_with_default "Steam API key" "")
    
    while ! validate_steam_api_key "$STEAM_API_KEY"; do
        print_warning "Steam API key should be 32 characters"
        STEAM_API_KEY=$(prompt_with_default "Steam API key" "")
    done
    
    print_success "Steam API configuration completed"
}

# Step 5: Steam Bot Account (Optional)
configure_steam_bot() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════${NC}"
    echo -e "${CYAN}  Step 5: Steam Bot Account (Optional)${NC}"
    echo -e "${CYAN}═══════════════════════════════════════${NC}"
    echo ""
    
    print_info "A Steam bot account enables inspect features for market items."
    print_warning "Use a dedicated account WITHOUT Steam Guard (2FA)"
    echo ""
    
    read -p "Configure Steam bot account? [y/N]: " use_bot
    
    if [[ "$use_bot" =~ ^[Yy]$ ]]; then
        STEAM_USERNAME=$(prompt_with_default "Steam username" "")
        STEAM_PASSWORD=$(prompt_password "Steam password")
        print_success "Steam bot account configured"
    else
        STEAM_USERNAME=""
        STEAM_PASSWORD=""
        print_info "Skipping Steam bot account (some features will be limited)"
    fi
}

# Step 6: Steam Service Configuration (Optional)
configure_steam_service() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════${NC}"
    echo -e "${CYAN}  Step 6: Steam Service (Optional)${NC}"
    echo -e "${CYAN}═══════════════════════════════════════${NC}"
    echo ""
    
    print_info "Use a separate Steam service for better scalability."
    echo ""
    
    read -p "Configure Steam service? [y/N]: " use_service
    
    if [[ "$use_service" =~ ^[Yy]$ ]]; then
        STEAM_SERVICE_URL=$(prompt_with_default "Steam service URL" "http://localhost:3001")
        STEAM_SERVICE_API_KEY=$(generate_secret)
        STEAM_SERVICE_PORT=$(prompt_with_default "Steam service port" "3001")
        print_success "Steam service configured"
    else
        STEAM_SERVICE_URL=""
        STEAM_SERVICE_API_KEY=""
        STEAM_SERVICE_PORT=""
        print_info "Skipping Steam service configuration"
    fi
}

# Step 7: Additional Settings
configure_additional() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════${NC}"
    echo -e "${CYAN}  Step 7: Additional Settings${NC}"
    echo -e "${CYAN}═══════════════════════════════════════${NC}"
    echo ""
    
    LOG_API_REQUESTS=$(prompt_with_default "Enable API request logging? [true/false]" "true")
    LOG_LEVEL=$(prompt_with_default "Log level (info/debug/warn/error)" "info")
    
    print_success "Additional settings configured"
}

# Generate .env file
generate_env_file() {
    echo ""
    print_info "Generating .env file..."
    
    cat > "$ENV_FILE" << EOF
########## Generated by CS2Inspect Setup Wizard ##########
# Generated on: $(date)

########## Server Configuration ##########
PORT=$PORT
HOST=$HOST
NODE_ENV=$NODE_ENV

########## JWT Configuration ##########
JWT_TOKEN=$JWT_TOKEN
JWT_EXPIRY=$JWT_EXPIRY

########## Database Configuration ##########
DATABASE_HOST=$DATABASE_HOST
DATABASE_PORT=$DATABASE_PORT
DATABASE_USER=$DATABASE_USER
DATABASE_PASSWORD=$DATABASE_PASSWORD
DATABASE_NAME=$DATABASE_NAME
DATABASE_CONNECTION_LIMIT=$DATABASE_CONNECTION_LIMIT

########## Steam API Configuration ##########
STEAM_API_KEY=$STEAM_API_KEY
EOF

    if [[ -n "$STEAM_USERNAME" ]]; then
        cat >> "$ENV_FILE" << EOF

########## Steam Bot Account ##########
STEAM_USERNAME=$STEAM_USERNAME
STEAM_PASSWORD=$STEAM_PASSWORD
EOF
    fi

    if [[ -n "$STEAM_SERVICE_URL" ]]; then
        cat >> "$ENV_FILE" << EOF

########## Steam Service Configuration ##########
STEAM_SERVICE_URL=$STEAM_SERVICE_URL
STEAM_SERVICE_API_KEY=$STEAM_SERVICE_API_KEY
STEAM_SERVICE_PORT=$STEAM_SERVICE_PORT
EOF
    fi

    cat >> "$ENV_FILE" << EOF

########## Logging ##########
LOG_API_REQUESTS=$LOG_API_REQUESTS
LOG_LEVEL=$LOG_LEVEL

########## Rate Limiting ##########
STEAM_RATE_LIMIT_DELAY=1500
STEAM_MAX_QUEUE_SIZE=100
STEAM_REQUEST_TIMEOUT=10000
STEAM_QUEUE_TIMEOUT=30000
EOF

    chmod 600 "$ENV_FILE"
    print_success ".env file created successfully"
}

# Display summary
display_summary() {
    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║       Configuration completed successfully!       ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BLUE}Configuration Summary:${NC}"
    echo ""
    echo "  Server:        $HOST:$PORT"
    echo "  Environment:   $NODE_ENV"
    echo "  Database:      $DATABASE_USER@$DATABASE_HOST:$DATABASE_PORT/$DATABASE_NAME"
    echo "  Steam API:     $([ ${#STEAM_API_KEY} -gt 0 ] && echo "Configured" || echo "Not configured")"
    echo "  Steam Bot:     $([ -n "$STEAM_USERNAME" ] && echo "Configured" || echo "Not configured")"
    echo "  Steam Service: $([ -n "$STEAM_SERVICE_URL" ] && echo "Configured" || echo "Not configured")"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo ""
    echo "1. Review configuration:"
    echo -e "   ${YELLOW}cat .env${NC}"
    echo ""
    echo "2. Initialize database:"
    echo -e "   ${YELLOW}bun run db:push${NC}"
    echo ""
    echo "3. Start application:"
    echo -e "   ${YELLOW}bun run dev${NC}     # Development"
    echo -e "   ${YELLOW}bun run build && bun run preview${NC}  # Production"
    echo ""
    echo "4. Access application:"
    echo -e "   ${YELLOW}http://$HOST:$PORT${NC}"
    echo ""
}

# Main wizard flow
main() {
    # Check if .env already exists
    if [[ -f "$ENV_FILE" ]]; then
        echo ""
        print_warning ".env file already exists!"
        read -p "Do you want to overwrite it? [y/N]: " overwrite
        
        if [[ ! "$overwrite" =~ ^[Yy]$ ]]; then
            print_info "Setup cancelled. Existing .env file preserved."
            exit 0
        fi
        
        # Backup existing file
        cp "$ENV_FILE" "${ENV_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
        print_info "Existing .env backed up"
    fi
    
    print_header
    
    echo ""
    print_info "This wizard will guide you through configuring CS2Inspect."
    print_info "Press Ctrl+C at any time to cancel."
    echo ""
    read -p "Press Enter to continue..."
    
    configure_server
    configure_jwt
    configure_database
    configure_steam_api
    configure_steam_bot
    configure_steam_service
    configure_additional
    
    generate_env_file
    display_summary
}

# Run main function
main "$@"
