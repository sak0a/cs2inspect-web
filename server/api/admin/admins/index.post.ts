/**
 * POST /api/admin/admins
 *
 * Creates a new admin user.
 * Body: { steamId: string, role: 'admin' | 'superadmin' }
 * Requires superadmin role.
 */
import { createError, readBody } from 'h3'
import { eq } from 'drizzle-orm'
import { useErrorHandling } from '~/server/utils/errorHandler'
import { useDatabase } from '~/server/utils/database'
import { adminUsers, adminActivityLog } from '~/server/database/schema'
import { createSuccessResponse, createResponseMeta } from '~/server/utils/api/responseHelpers'
import { parseBodyWithSchema } from '~/server/utils/validation/zodHelpers'
import { adminAddAdminSchema } from '~/server/utils/validation/adminSchemas'

export default useErrorHandling(async (event) => {
    const startTime = Date.now()

    // Check superadmin role
    if (event.context.admin?.role !== 'superadmin') {
        throw createError({
            statusCode: 403,
            message: 'Superadmin access required',
        })
    }

    const body = await readBody(event)
    const { steamId, role } = parseBodyWithSchema(adminAddAdminSchema, body)

    const db = useDatabase()
    const adminSteamId = event.context.admin.steamId

    // Check if admin already exists
    const [existing] = await db
        .select({ id: adminUsers.id })
        .from(adminUsers)
        .where(eq(adminUsers.steamid, steamId))
        .limit(1)

    if (existing) {
        throw createError({
            statusCode: 409,
            message: 'Admin user already exists with this Steam ID',
        })
    }

    // Insert new admin user
    await db.insert(adminUsers).values({
        steamid: steamId,
        role,
        permissions: [],
        created_by: adminSteamId,
    })

    // Log action to adminActivityLog
    await db.insert(adminActivityLog).values({
        admin_steamid: adminSteamId,
        action: 'add_admin',
        target_steamid: steamId,
        details: {
            role,
        },
    })

    // Fetch the created admin
    const [createdAdmin] = await db
        .select({
            id: adminUsers.id,
            steamId: adminUsers.steamid,
            role: adminUsers.role,
            permissions: adminUsers.permissions,
            createdBy: adminUsers.created_by,
            createdAt: adminUsers.created_at,
        })
        .from(adminUsers)
        .where(eq(adminUsers.steamid, steamId))
        .limit(1)

    const meta = createResponseMeta(startTime, { method: 'POST' })
    return createSuccessResponse(createdAdmin, meta, 'Admin user created successfully')
}, 'ADMIN_MANAGEMENT_ERROR')
