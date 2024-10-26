import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || '4dj52dl6fq8532s!dkfj'

export function createJwtToken(snippetId: string) {
    return jwt.sign({ snippetId }, JWT_SECRET, { expiresIn: '30m' });
}
export function verifyJwtToken(token: string) {
    return jwt.verify(token, JWT_SECRET);
}
