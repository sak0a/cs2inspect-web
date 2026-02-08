/**
 * Admin Authentication Middleware
 *
 * Validates that the authenticated user has admin privileges for /api/admin/* routes
 */
import { createError, defineEventHandler } from 'h3';
import { eq } from 'drizzle-orm';
import { ADMIN_API_PATHS } from '~/server/utils/constants';
import { adminUsers } from '~/server/database/schema';
import { useDatabase } from '~/server/utils/database';

export interface AdminContext {
    steamId: string;
    role: 'admin' | 'superadmin';
    permissions: string[];
}

declare module 'h3' {
    interface H3EventContext {
        admin?: AdminContext;
    }
}

export default defineEventHandler(async (event) => {
    const path = event.node.req.url;

    // Skip admin check for non-admin routes
    if (!path || !ADMIN_API_PATHS.some(route => path.startsWith(route))) {
        return;
    }

    // Auth middleware runs first and sets event.context.auth
    const auth = event.context.auth as { steamId?: string } | undefined;

    // Debug logging
    console.log('\n' + '═'.repeat(60));
    console.log('[admin-auth] ADMIN ACCESS CHECK');
    console.log('═'.repeat(60));
    console.log('[admin-auth] Path:', path);
    console.log('[admin-auth] Auth context:', JSON.stringify(auth, null, 2));

    if (!auth?.steamId) {
        console.log('[admin-auth] ✗ DENIED - No steamId in auth context');
        console.log('[admin-auth] Reason: User not authenticated (no JWT or missing steamId claim)');
        console.log('═'.repeat(60) + '\n');
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized',
            message: 'Authentication required for admin access. Please log in first.',
            data: { reason: 'no_auth', path }
        });
    }

    const db = useDatabase();

    // First, let's see all admins in the table for debugging
    const allAdmins = await db
        .select({
            steamid: adminUsers.steamid,
            role: adminUsers.role,
        })
        .from(adminUsers);

    console.log('[admin-auth] Steam ID from JWT:', auth.steamId);
    console.log('[admin-auth] Steam ID type:', typeof auth.steamId);
    console.log('[admin-auth] Steam ID length:', auth.steamId.length);
    console.log('[admin-auth] All admins in database:', JSON.stringify(allAdmins, null, 2));

    // Check if user is an admin
    const [admin] = await db
        .select({
            steamid: adminUsers.steamid,
            role: adminUsers.role,
            permissions: adminUsers.permissions,
        })
        .from(adminUsers)
        .where(eq(adminUsers.steamid, auth.steamId))
        .limit(1);

    console.log('[admin-auth] Admin lookup result:', admin ? JSON.stringify(admin) : 'NOT FOUND');

    // Check for string comparison issues
    if (!admin && allAdmins.length > 0) {
        const firstAdmin = allAdmins[0];
        if (firstAdmin) {
            console.log('[admin-auth] Comparing:');
            console.log('[admin-auth]   JWT steamId:', JSON.stringify(auth.steamId));
            console.log('[admin-auth]   DB steamid:', JSON.stringify(firstAdmin.steamid));
            console.log('[admin-auth]   Are equal:', auth.steamId === firstAdmin.steamid);
            console.log('[admin-auth]   JWT chars:', [...auth.steamId].map(c => c.charCodeAt(0)));
            console.log('[admin-auth]   DB chars:', [...firstAdmin.steamid].map(c => c.charCodeAt(0)));
        }
    }

    if (!admin) {
        console.log('[admin-auth] ✗ DENIED - User is not in admin_users table');
        console.log('[admin-auth] Steam ID checked:', auth.steamId);
        console.log('[admin-auth] Make sure this Steam ID exists in admin_users table');
        console.log('═'.repeat(60) + '\n');
        throw createError({
            statusCode: 403,
            statusMessage: 'Forbidden',
            message: `User ${auth.steamId} does not have admin access`,
            data: { reason: 'not_admin', steamId: auth.steamId }
        });
    }

    console.log('[admin-auth] ✓ ACCESS GRANTED');
    console.log('[admin-auth] Admin:', admin.steamid, '| Role:', admin.role);
    console.log('═'.repeat(60) + '\n');

    // Set admin context for use in API routes
    event.context.admin = {
        steamId: admin.steamid,
        role: admin.role as 'admin' | 'superadmin',
        permissions: admin.permissions || [],
    };
});
