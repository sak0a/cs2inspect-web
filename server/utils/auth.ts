import jwt from "jsonwebtoken";

const SECRET = process.env.SECRET_AUTH_TOKEN;

export function createJwtToken(snippetId: string) {
    return jwt.sign({ snippetId }, SECRET, { expiresIn: '30m' });
}
export function verifyJwtToken(token: string) {
    return jwt.verify(token, SECRET);
}
