import jwt from "jsonwebtoken";

const SECRET = process.env.AUTH_TOKEN || 'secret';
const EXPIRATION = process.env.AUTH_TOKEN_EXPIRATION || '30m';

export function createJwtToken(snippetId: string) {
    return jwt.sign({ snippetId }, SECRET, { expiresIn: EXPIRATION });
}
export function createJwtTokenWithExpiration(snippetId: string, expiration: string) {
    return jwt.sign({ snippetId }, SECRET, { expiresIn: expiration });
}
export function verifyJwtToken(token: string) {
    return jwt.verify(token, SECRET);
}
