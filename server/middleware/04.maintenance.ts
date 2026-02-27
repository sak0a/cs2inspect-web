import { createError, defineEventHandler } from 'h3'
import { getCachedSetting } from '~/server/utils/settingsCache'

export default defineEventHandler(async (event) => {
    const path = event.node.req.url
    if (!path) return

    // Always allow auth, admin, and public settings routes
    if (
        path.startsWith('/api/steam/') ||
        path.startsWith('/api/admin/') ||
        path.startsWith('/api/public/')
    ) return

    const maintenance = await getCachedSetting('MAINTENANCE_MODE', false)
    if (!maintenance) return

    // Admin users bypass maintenance
    if (event.context.admin) return

    throw createError({
        statusCode: 503,
        statusMessage: 'Service Unavailable',
        message: 'The site is currently under maintenance. Please try again later.',
    })
})
