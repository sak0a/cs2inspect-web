/**
 * Admin Route Middleware
 *
 * @description Protects admin routes by verifying:
 * 1. User is authenticated
 * 2. User has admin privileges
 * Redirects to error page if checks fail.
 */
import { defineNuxtRouteMiddleware, navigateTo } from '#app'
import { useAdminStore } from '~/stores/adminStore'

export default defineNuxtRouteMiddleware(async (to) => {
    // Skip middleware on server-side (will be checked client-side)
    if (import.meta.server) {
        return
    }

    // Skip middleware for the error page itself
    if (to.path === '/admin/error') {
        return
    }

    const adminStore = useAdminStore()

    console.log('[admin-middleware] Checking admin status for:', to.fullPath)

    // Check admin status
    const isAdmin = await adminStore.checkAdminStatus()

    console.log('[admin-middleware] isAdmin:', isAdmin, 'error:', adminStore.error)

    if (!isAdmin) {
        console.log('[admin-middleware] Access denied, redirecting to error page')
        // Redirect to admin error page
        return navigateTo({
            path: '/admin/error',
            query: {
                error: 'admin_required',
                redirect: to.fullPath
            }
        })
    }

    // For superadmin-only routes, check role
    if (to.meta.requiresSuperAdmin && !adminStore.isSuperAdmin) {
        console.log('[admin-middleware] Superadmin required, redirecting to error page')
        return navigateTo({
            path: '/admin/error',
            query: {
                error: 'superadmin_required',
                redirect: to.fullPath
            }
        })
    }

    console.log('[admin-middleware] Access granted')
})
