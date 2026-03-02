/**
 * useAdminAuth - Composable for admin authentication and authorization
 *
 * @description Provides admin status checks, role verification, and route guards
 * for protecting admin-only routes and features.
 */
import { computed, ref, type ComputedRef } from 'vue'
import { useAdminStore } from '~/stores/adminStore'

// ============================================================================
// INTERFACES
// ============================================================================

export interface AdminAuthReturn {
  /** Whether the current user is an admin */
  isAdmin: ComputedRef<boolean>
  /** Whether the current user is a superadmin */
  isSuperAdmin: ComputedRef<boolean>
  /** Current admin role ('admin' | 'superadmin' | null) */
  adminRole: ComputedRef<'admin' | 'superadmin' | null>
  /** Whether admin status is being checked */
  isChecking: ComputedRef<boolean>
  /** Check admin status (call on mount or route change) */
  checkAdminStatus: () => Promise<boolean>
  /** Require admin access - throws or redirects if not admin */
  requireAdmin: () => Promise<void>
  /** Require superadmin access - throws or redirects if not superadmin */
  requireSuperAdmin: () => Promise<void>
  /** Check if user has specific permission */
  hasPermission: (permission: string) => boolean
}

// ============================================================================
// COMPOSABLE
// ============================================================================

/**
 * Admin authentication composable
 *
 * @example
 * ```typescript
 * const { isAdmin, isSuperAdmin, checkAdminStatus, requireAdmin } = useAdminAuth()
 *
 * // Check on component mount
 * onMounted(async () => {
 *   await checkAdminStatus()
 * })
 *
 * // Guard a route or action
 * async function performAdminAction() {
 *   await requireAdmin()
 *   // ... admin-only logic
 * }
 * ```
 */
export function useAdminAuth(): AdminAuthReturn {
  const adminStore = useAdminStore()
  const isChecking = ref(false)

  // ========================================================================
  // COMPUTED PROPERTIES
  // ========================================================================

  const isAdmin = computed(() => adminStore.isAdmin)
  const isSuperAdmin = computed(() => adminStore.isSuperAdmin)
  const adminRole = computed(() => adminStore.adminRole)

  // ========================================================================
  // METHODS
  // ========================================================================

  /**
   * Check if current user is an admin
   * Returns true if admin, false otherwise
   */
  async function checkAdminStatus(): Promise<boolean> {
    if (isChecking.value) {
      // Already checking, wait a bit and return current status
      await new Promise((resolve) => setTimeout(resolve, 100))
      return adminStore.isAdmin
    }

    isChecking.value = true
    try {
      return await adminStore.checkAdminStatus()
    } finally {
      isChecking.value = false
    }
  }

  /**
   * Require admin access
   * Throws an error if user is not an admin
   */
  async function requireAdmin(): Promise<void> {
    // Check status if not already confirmed
    if (!adminStore.isAdmin) {
      const isAdminUser = await checkAdminStatus()
      if (!isAdminUser) {
        throw new Error('Admin access required')
      }
    }
  }

  /**
   * Require superadmin access
   * Throws an error if user is not a superadmin
   */
  async function requireSuperAdmin(): Promise<void> {
    await requireAdmin()

    if (!adminStore.isSuperAdmin) {
      throw new Error('Superadmin access required')
    }
  }

  /**
   * Check if user has a specific permission
   */
  function hasPermission(permission: string): boolean {
    if (!adminStore.isAdmin) return false
    if (adminStore.isSuperAdmin) return true // Superadmins have all permissions
    return adminStore.adminPermissions.includes(permission)
  }

  // ========================================================================
  // RETURN
  // ========================================================================

  return {
    isAdmin,
    isSuperAdmin,
    adminRole,
    isChecking: computed(() => isChecking.value),
    checkAdminStatus,
    requireAdmin,
    requireSuperAdmin,
    hasPermission,
  }
}

// ============================================================================
// UTILITY: NAVIGATION GUARD
// ============================================================================

/**
 * Create a navigation guard for admin routes
 * Use in definePageMeta or router middleware
 *
 * @example
 * ```typescript
 * // In pages/admin/index.vue
 * definePageMeta({
 *   middleware: 'admin'
 * })
 * ```
 */
export async function adminNavigationGuard(): Promise<boolean | string> {
  const adminStore = useAdminStore()

  // Try to check admin status
  const isAdmin = await adminStore.checkAdminStatus()

  if (!isAdmin) {
    // Return redirect path
    return '/'
  }

  return true
}

/**
 * Create a navigation guard for superadmin routes
 */
export async function superAdminNavigationGuard(): Promise<boolean | string> {
  const adminStore = useAdminStore()

  // Check admin status first
  const isAdmin = await adminStore.checkAdminStatus()

  if (!isAdmin) {
    return '/'
  }

  if (!adminStore.isSuperAdmin) {
    return '/admin'
  }

  return true
}
