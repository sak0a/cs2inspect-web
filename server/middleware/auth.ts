import jwt from 'jsonwebtoken'
import { createError, defineEventHandler, parseCookies } from 'h3'

const JWT_SECRET = process.env.JWT_TOKEN || 'your-secret-key' // Make sure to set this in production
const PROTECTED_PATHS = ['/api/skins', '/api/weapons', '/api/loadouts'] // Add your protected routes

export default defineEventHandler(async (event) => {
    const path = event.node.req.url
    // Skip auth check for non-protected routes
    if (!path || !PROTECTED_PATHS.some(route => path.startsWith(route))) {
        return
    }

    try {
        const cookies = parseCookies(event)
        const token = cookies.auth_token

        if (!token) {
            throw createError({
                statusCode: 401,
                message: 'Authentication required'
            })
        }

        try {
            // Verify JWT token
            const decoded = jwt.verify(token, JWT_SECRET)
            // Add user info to event context for use in API routes
            event.context.auth = decoded
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