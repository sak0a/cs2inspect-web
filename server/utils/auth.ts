import jwt from "jsonwebtoken";

const SECRET = process.env.SECRET_AUTH_TOKEN || 'secret';

export function createJwtToken(snippetId: string) {
    return jwt.sign({ snippetId }, SECRET, { expiresIn: '30m' });
}
export function createJwtTokenWithExpiration(snippetId: string, expiration: string) {
    return jwt.sign({ snippetId }, SECRET, { expiresIn: expiration });
}
export function verifyJwtToken(token: string) {
    return jwt.verify(token, SECRET);
}
