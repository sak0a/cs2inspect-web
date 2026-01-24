#!/bin/bash

###########################################
# Environment Validation Script
# 
# Validates that all required environment
# variables are properly configured
###########################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Error counter
errors=0
warnings=0

print_header() {
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    echo -e "${BLUE}  Environment Configuration Validator${NC}"
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    errors=$((errors + 1))
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    warnings=$((warnings + 1))
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if .env file exists
check_env_file() {
    if [ ! -f .env ]; then
        print_error ".env file not found"
        echo ""
        print_info "Create .env file from template:"
        echo "  cp .env.example .env"
        echo ""
        print_info "Or use the setup wizard:"
        echo "  ./scripts/setup-wizard.sh"
        echo ""
        exit 1
    fi
    print_success ".env file found"
}

# Load environment variables
load_env() {
    if [ -f .env ]; then
        export $(cat .env | grep -v '^#' | grep -v '^$' | xargs)
    fi
}

# Validate server configuration
validate_server() {
    echo ""
    print_info "Validating server configuration..."
    
    if [ -z "$PORT" ]; then
        print_error "PORT is not set"
    elif [ "$PORT" -lt 1 ] || [ "$PORT" -gt 65535 ]; then
        print_error "PORT must be between 1 and 65535"
    else
        print_success "PORT is set to $PORT"
    fi
    
    if [ -z "$HOST" ]; then
        print_error "HOST is not set"
    else
        print_success "HOST is set to $HOST"
    fi
    
    if [ -z "$NODE_ENV" ]; then
        print_warning "NODE_ENV is not set (defaults to development)"
    else
        print_success "NODE_ENV is set to $NODE_ENV"
    fi
}

# Validate JWT configuration
validate_jwt() {
    echo ""
    print_info "Validating JWT configuration..."
    
    if [ -z "$JWT_TOKEN" ]; then
        print_error "JWT_TOKEN is not set"
    elif [ ${#JWT_TOKEN} -lt 32 ]; then
        print_error "JWT_TOKEN should be at least 32 characters (current: ${#JWT_TOKEN})"
    else
        print_success "JWT_TOKEN is set and secure"
    fi
    
    if [ -z "$JWT_EXPIRY" ]; then
        print_warning "JWT_EXPIRY is not set (defaults to 7d)"
    else
        print_success "JWT_EXPIRY is set to $JWT_EXPIRY"
    fi
}

# Validate database configuration
validate_database() {
    echo ""
    print_info "Validating database configuration..."
    
    if [ -z "$DATABASE_HOST" ]; then
        print_error "DATABASE_HOST is not set"
    else
        print_success "DATABASE_HOST is set to $DATABASE_HOST"
    fi
    
    if [ -z "$DATABASE_PORT" ]; then
        print_error "DATABASE_PORT is not set"
    else
        print_success "DATABASE_PORT is set to $DATABASE_PORT"
    fi
    
    if [ -z "$DATABASE_USER" ]; then
        print_error "DATABASE_USER is not set"
    else
        print_success "DATABASE_USER is set"
    fi
    
    if [ -z "$DATABASE_PASSWORD" ]; then
        print_error "DATABASE_PASSWORD is not set"
    else
        print_success "DATABASE_PASSWORD is set"
    fi
    
    if [ -z "$DATABASE_NAME" ]; then
        print_error "DATABASE_NAME is not set"
    else
        print_success "DATABASE_NAME is set to $DATABASE_NAME"
    fi
    
    # Test database connection if mysql client is available
    if command -v mysql &> /dev/null; then
        echo ""
        print_info "Testing database connection..."
        if mysql -h"$DATABASE_HOST" -P"$DATABASE_PORT" -u"$DATABASE_USER" -p"$DATABASE_PASSWORD" -e "USE $DATABASE_NAME" 2>/dev/null; then
            print_success "Database connection successful"
        else
            print_error "Database connection failed"
        fi
    else
        print_warning "MySQL client not installed, skipping connection test"
    fi
}

# Validate Steam API configuration
validate_steam() {
    echo ""
    print_info "Validating Steam API configuration..."
    
    if [ -z "$STEAM_API_KEY" ]; then
        print_error "STEAM_API_KEY is not set"
    elif [ ${#STEAM_API_KEY} -ne 32 ]; then
        print_warning "STEAM_API_KEY should be 32 characters (current: ${#STEAM_API_KEY})"
    else
        print_success "STEAM_API_KEY is set"
    fi
    
    # Check Steam bot account (optional)
    if [ -n "$STEAM_USERNAME" ] && [ -n "$STEAM_PASSWORD" ]; then
        print_success "Steam bot account configured"
    else
        print_warning "Steam bot account not configured (some features will be limited)"
    fi
    
    # Check Steam service (optional)
    if [ -n "$STEAM_SERVICE_URL" ]; then
        print_success "Steam service URL configured: $STEAM_SERVICE_URL"
        
        if [ -n "$STEAM_SERVICE_API_KEY" ]; then
            print_success "Steam service API key configured"
        else
            print_warning "Steam service API key not configured"
        fi
    fi
}

# Validate file permissions
validate_permissions() {
    echo ""
    print_info "Validating file permissions..."
    
    # Check if .env is readable
    if [ -r .env ]; then
        print_success ".env file is readable"
    else
        print_error ".env file is not readable"
    fi
    
    # Check if scripts are executable
    if [ -x scripts/install.sh ]; then
        print_success "install.sh is executable"
    else
        print_warning "install.sh is not executable (run: chmod +x scripts/install.sh)"
    fi
    
    if [ -x scripts/setup-wizard.sh ]; then
        print_success "setup-wizard.sh is executable"
    else
        print_warning "setup-wizard.sh is not executable (run: chmod +x scripts/setup-wizard.sh)"
    fi
}

# Print summary
print_summary() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    echo -e "${BLUE}  Validation Summary${NC}"
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    echo ""
    
    if [ $errors -eq 0 ] && [ $warnings -eq 0 ]; then
        echo -e "${GREEN}✅ All checks passed!${NC}"
        echo ""
        print_info "Your environment is properly configured."
        echo ""
        echo "Next steps:"
        echo "  1. Run database migrations: bun run db:push"
        echo "  2. Start development server: bun run dev"
        echo "  3. Or build for production: bun run build"
        echo ""
        return 0
    else
        if [ $errors -gt 0 ]; then
            echo -e "${RED}❌ Found $errors error(s)${NC}"
        fi
        
        if [ $warnings -gt 0 ]; then
            echo -e "${YELLOW}⚠️  Found $warnings warning(s)${NC}"
        fi
        
        echo ""
        print_info "Please fix the errors before proceeding."
        echo ""
        
        if [ $errors -gt 0 ]; then
            return 1
        else
            return 0
        fi
    fi
}

# Main validation flow
main() {
    print_header
    
    check_env_file
    load_env
    
    validate_server
    validate_jwt
    validate_database
    validate_steam
    validate_permissions
    
    print_summary
}

# Run validation
main "$@"
