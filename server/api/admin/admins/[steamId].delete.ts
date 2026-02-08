/**
 * DELETE /api/admin/admins/:steamId
 *
 * Deletes an admin user.
 * - Cannot delete yourself
 * - Cannot delete if only remaining superadmin
 * Requires superadmin role.
 */
import { createError } from 'h3'
import { eq } from 'drizzle-orm'
import { useErrorHandling } from '~/server/utils/errorHandler'
import { useDatabase } from '~/server/utils/database'
import { adminUsers, adminActivityLog } from '~/server/database/schema'
import {
    createSuccessResponse,
    createResponseMeta,
} from '~/server/utils/api/responseHelpers'

export default useErrorHandling(async (event) => {
    const startTime = Date.now()

    // Check superadmin role
    if (event.context.admin?.role !== 'superadmin') {
        throw createError({
            statusCode: 403,
            message: 'Superadmin access required',
        })
    }

    const targetSteamId = event.context.params?.steamId

    if (!targetSteamId) {
        throw createError({
            statusCode: 400,
            message: 'Steam ID is required',
        })
    }

    const db = useDatabase()
    const adminSteamId = event.context.admin.steamId

    // Cannot delete yourself
    if (targetSteamId === adminSteamId) {
        throw createError({
            statusCode: 400,
            message: 'Cannot delete your own admin account',
        })
    }

    // Check if target admin exists
    const [targetAdmin] = await db
        .select({
            id: adminUsers.id,
            role: adminUsers.role,
        })
        .from(adminUsers)
        .where(eq(adminUsers.steamid, targetSteamId))
        .limit(1)

    if (!targetAdmin) {
        throw createError({
            statusCode: 404,
            message: 'Admin user not found',
        })
    }

    // If deleting a superadmin, check if they are the only one remaining
    if (targetAdmin.role === 'superadmin') {
        const superadmins = await db
            .select({ id: adminUsers.id })
            .from(adminUsers)
            .where(eq(adminUsers.role, 'superadmin'))

        if (superadmins.length <= 1) {
            throw createError({
                statusCode: 400,
                message: 'Cannot delete the only remaining superadmin',
            })
        }
    }

    // Delete the admin user
    await db
        .delete(adminUsers)
        .where(eq(adminUsers.steamid, targetSteamId))

    // Log action to adminActivityLog
    await db.insert(adminActivityLog).values({
        admin_steamid: adminSteamId,
        action: 'remove_admin',
        target_steamid: targetSteamId,
        details: {
            deletedRole: targetAdmin.role,
        },
    })

    const meta = createResponseMeta(startTime, { method: 'DELETE' })
    return createSuccessResponse(
        { steamId: targetSteamId },
        meta,
        'Admin user deleted successfully'
    )
}, 'ADMIN_MANAGEMENT_ERROR')
