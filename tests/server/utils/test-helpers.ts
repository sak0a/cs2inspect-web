/**
 * Test utilities for server-side testing
 */
import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';

// Use a clearly marked test secret that should never be used in production
const JWT_SECRET = process.env.JWT_TOKEN || 'test-secret-key-do-not-use-in-production';

/**
 * Generate a valid JWT token for testing
 */
export function generateValidToken(steamId: string = '76561198000000000', expiresIn: string = '1h'): string {
    const payload = {
        steamId,
        type: 'steam_auth'
    };
    
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn
    } as SignOptions);
}

/**
 * Generate an expired JWT token for testing
 */
export function generateExpiredToken(steamId: string = '76561198000000000'): string {
    const payload = {
        steamId,
        type: 'steam_auth'
    };
    
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: '-1h' // Already expired
    } as SignOptions);
}

/**
 * Generate a JWT token with invalid signature
 */
export function generateInvalidSignatureToken(steamId: string = '76561198000000000'): string {
    const payload = {
        steamId,
        type: 'steam_auth'
    };
    
    // Use a different secret to create invalid signature
    return jwt.sign(payload, 'wrong-secret-key', {
        expiresIn: '1h'
    } as SignOptions);
}

/**
 * Create auth cookie string for testing
 */
export function createAuthCookie(token: string): string {
    return `auth_token=${token}`;
}

/**
 * Test user data
 */
export const TEST_USERS = {
    VALID_USER: {
        steamId: '76561198000000001',
        type: 'steam_auth'
    },
    ANOTHER_USER: {
        steamId: '76561198000000002',
        type: 'steam_auth'
    }
};
