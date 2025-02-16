import jwt from 'jsonwebtoken'
import { createError, defineEventHandler, parseCookies } from 'h3'
import { PROTECTED_API_PATHS } from "~/server/utils/constants";

const JWT_SECRET = process.env.JWT_TOKEN || 'your-secret-key' // Make sure to set this in production

export default defineEventHandler(async (event) => {
    const path = event.node.req.url
    // Skip auth check for non-protected routes
    if (!path || !PROTECTED_API_PATHS.some(route => path.startsWith(route))) {
        return;
    }

    try {
        const cookies: Record<string, string> = parseCookies(event);
        const token = cookies.auth_token;

        if (!token) {
            throw createError({
                statusCode: 401,
                message: 'Authentication required'
            })
        }

        try {
            // Verify JWT token
            // Add user info to event context for use in API routes
            event.context.auth = jwt.verify(token, JWT_SECRET)
        } catch (jwtError) {
            throw createError({
                statusCode: 401,
                message: 'Invalid token'
            })
        }

    } catch (error) {
        throw createError({
            statusCode: 401,
            message: 'Authentication failed'
        })
    }
})