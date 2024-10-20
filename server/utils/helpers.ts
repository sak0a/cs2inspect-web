import jwt from "jsonwebtoken";

export function addExpiryDate(expiry) {
    const now = new Date();

    switch (expiry) {
        case '1_hour':
            return new Date(now.getTime() + 1 * 60 * 60 * 1000); // 1 hour
        case '2_hours':
            return new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours
        case '4_hours':
            return new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours
        case '8_hours':
            return new Date(now.getTime() + 8 * 60 * 60 * 1000); // 8 hours
        case '1_day':
            return new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day
        case '1_week':
            return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 1 week
        case '1_month':
            return new Date(now.setMonth(now.getMonth() + 1)); // 1 month
        case 'permanent':
            return null; // Permanent, no expiration
        default:
            return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Default to 1 week
    }
}

// JWT token creation for password-protected snippets
export function createJwtToken(snippetId: string) {
    return jwt.sign({ snippetId }, JWT_SECRET, { expiresIn: '10m' });
}

// JWT token validation
export function verifyJwtToken(token: string) {
    return jwt.verify(token, JWT_SECRET);
}