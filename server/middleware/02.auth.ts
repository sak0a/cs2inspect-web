import jwt from 'jsonwebtoken'
import { createError, defineEventHandler, parseCookies } from 'h3'
import { eq, and } from 'drizzle-orm'
import { PROTECTED_API_PATHS } from "~/server/utils/constants";
import { bannedUsers } from '~/server/database/schema';
import { useDatabase } from '~/server/utils/database';

const JWT_SECRET = process.env.JWT_TOKEN || 'your-secret-key' // Make sure to set this in production

export default defineEventHandler(async (event) => {
    const path = event.node.req.url
    // Skip auth check for non-protected routes
    if (!path || !PROTECTED_API_PATHS.some(route => path.startsWith(route))) {
        return;
    }

    // Debug logging for admin routes
    const isAdminRoute = path.startsWith('/api/admin/');
    if (isAdminRoute) {
        console.log('\n' + '─'.repeat(60));
        console.log('[auth] ADMIN ROUTE AUTHENTICATION');
        console.log('─'.repeat(60));
        console.log('[auth] Path:', path);
    }

    const cookies: Record<string, string> = parseCookies(event);
    const token = cookies.auth_token;

    if (!token) {
        if (isAdminRoute) {
            console.log('[auth] ✗ FAILED - No auth_token cookie found');
            console.log('[auth] User needs to log in first');
            console.log('─'.repeat(60));
        }
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized',
            message: 'Authentication required. Please log in.',
            data: { reason: 'no_token', path }
        })
    }

    try {
        // Verify JWT token
        // Add user info to event context for use in API routes
        const decoded = jwt.verify(token, JWT_SECRET) as { steamId?: string }
        event.context.auth = decoded

        if (isAdminRoute) {
            console.log('[auth] ✓ JWT valid - Steam ID:', decoded.steamId);
            console.log('─'.repeat(60));
        }

        // Check if user is banned
        if (decoded.steamId) {
            const db = useDatabase()
            const [ban] = await db
                .select({ id: bannedUsers.id, reason: bannedUsers.reason })
                .from(bannedUsers)
                .where(
                    and(
                        eq(bannedUsers.steamid, decoded.steamId),
                        eq(bannedUsers.active, 1)
                    )
                )
                .limit(1)

            if (ban) {
                throw createError({
                    statusCode: 403,
                    message: ban.reason
                        ? `Your account has been banned: ${ban.reason}`
                        : 'Your account has been banned'
                })
            }
        }
    } catch (error) {
        // Re-throw H3 errors (like our ban error)
        if (error && typeof error === 'object' && 'statusCode' in error) {
            throw error
        }
        if (isAdminRoute) {
            console.log('[auth] ✗ FAILED - JWT verification error');
            console.log('[auth] Error:', error instanceof Error ? error.message : error);
            console.log('─'.repeat(60));
        }
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized',
            message: 'Invalid or expired token. Please log in again.',
            data: { reason: 'invalid_token', path }
        })
    }
})