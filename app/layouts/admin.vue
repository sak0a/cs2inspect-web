<script setup lang="ts">
import {
  LucideLayoutDashboard as DashboardIcon,
  LucideUsers as UsersIcon,
  LucideHeartPulse as HealthIcon,
  LucideSettings as SettingsIcon,
  LucideActivity as ActivityIcon,
  LucideShield as ShieldIcon,
  LucidePlug as PlugIcon,
  LucideHome as HomeIcon,
} from '@lucide/vue'
import { steamAuth, type SteamUser } from '~/services/steamAuth'
import { useAdminStore } from '~/stores/adminStore'

// Get admin store for role check
const adminStore = useAdminStore()

// User state
const user = ref<SteamUser | null>(null)

// Route for active state
const route = useRoute()

// Navigation items
const navigationItems = computed(() => {
  const items = [
    { key: 'dashboard', label: 'Dashboard', icon: DashboardIcon, path: '/admin' },
    { key: 'users', label: 'Users', icon: UsersIcon, path: '/admin/users' },
    { key: 'health', label: 'System Health', icon: HealthIcon, path: '/admin/health' },
    { key: 'settings', label: 'Settings', icon: SettingsIcon, path: '/admin/settings' },
    { key: 'activity', label: 'Activity Log', icon: ActivityIcon, path: '/admin/activity' },
  ]

  // Add superadmin-only pages
  if (adminStore.isSuperAdmin) {
    items.push({ key: 'plugin', label: 'Plugin Config', icon: PlugIcon, path: '/admin/plugin' })
    items.push({
      key: 'admins',
      label: 'Admin Management',
      icon: ShieldIcon,
      path: '/admin/admins',
    })
  }

  return items
})

const selectedKey = ref('/admin')

const resolveActivePath = (path: string) => {
  if (path === '/admin' || path === '/admin/') return '/admin'
  const match = navigationItems.value
    .filter((item) => item.path !== '/admin')
    .sort((a, b) => b.path.length - a.path.length)
    .find((item) => path.startsWith(item.path))
  return match?.path || path
}

watch(
  () => route.path,
  (path) => {
    selectedKey.value = resolveActivePath(path)
  },
  { immediate: true }
)

const adminRoleLabel = computed(() => (adminStore.isSuperAdmin ? 'Super Admin' : 'Admin'))

function handleLogout() {
  steamAuth.logout()
  user.value = null
  window.location.href = '/'
}

// Load user on mount
onMounted(() => {
  user.value = steamAuth.getSavedUser()
})
</script>

<template>
  <div class="admin-layout">
    <!-- Top Bar -->
    <header class="admin-topbar">
      <div class="admin-topbar-left">
        <div class="admin-brand">
          <div class="admin-brand-icon">
            <ShieldIcon :size="22" />
          </div>
          <div class="admin-brand-text">
            <span class="admin-brand-title">Admin Panel</span>
            <span class="admin-brand-tagline">Control Center</span>
          </div>
        </div>

        <div v-if="user" class="admin-user-compact">
          <a
            :href="user.profileUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="admin-user-avatar"
          >
            <img :src="user.avatarFull" :alt="user.personaName" class="w-9 h-9 rounded-full" />
          </a>
          <div class="admin-user-details">
            <span class="admin-user-name">{{ user.personaName }}</span>
            <span class="admin-user-role">{{ adminRoleLabel }}</span>
          </div>
        </div>
      </div>

      <div class="admin-topbar-center">
        <nav class="admin-topbar-menu" aria-label="Admin navigation">
          <NuxtLink
            v-for="item in navigationItems"
            :key="item.key"
            :to="item.path"
            class="admin-nav-item"
            :class="{ 'admin-nav-item--selected': selectedKey === item.path }"
            :aria-current="selectedKey === item.path ? 'page' : undefined"
          >
            <span class="admin-nav-icon">
              <component :is="item.icon" :size="18" />
            </span>
            <span class="admin-nav-label">{{ item.label }}</span>
          </NuxtLink>
        </nav>
      </div>

      <div class="admin-topbar-right">
        <SettingsDropdown
          trigger="hover"
          variant="icon"
          size="default"
          :show-tutorials="false"
          :show-admin-link="false"
          @logout="handleLogout"
        />
        <TooltipProvider :delay-duration="300">
          <Tooltip>
            <TooltipTrigger as-child>
              <Button variant="ghost" size="icon-sm" as="a" href="/">
                <template #icon-left>
                  <HomeIcon :size="18" />
                </template>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Back to Site</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </header>

    <!-- Main Content -->
    <main class="admin-content">
      <div class="admin-content-body">
        <slot />
      </div>
    </main>
  </div>
</template>

<style lang="sass">
// Global styles for admin layout
.admin-layout
  display: flex
  flex-direction: column
  min-height: 100vh
  height: 100vh
  overflow: hidden
  background: #080808
  color: var(--text-primary)
  --admin-accent: var(--primary-color)
  --admin-accent-rgb: 250, 204, 21

// Top Bar
.admin-topbar
  display: grid
  grid-template-columns: auto 1fr auto
  align-items: center
  gap: 24px
  padding: 14px 24px
  background: rgba(10, 10, 10, 0.5)
  backdrop-filter: var(--admin-glass-blur-strong) var(--glass-saturation)
  -webkit-backdrop-filter: var(--admin-glass-blur-strong) var(--glass-saturation)
  border-bottom: 1px solid rgba(255, 255, 255, 0.06)
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4)
  position: sticky
  top: 0
  z-index: 120

  @media (max-width: 900px)
    grid-template-columns: 1fr
    gap: 12px

.admin-topbar-left
  display: flex
  align-items: center
  gap: 16px
  min-width: 0

  @media (max-width: 900px)
    justify-content: space-between

.admin-brand
  display: flex
  align-items: center
  gap: 12px

.admin-brand-icon
  width: 36px
  height: 36px
  border-radius: 12px
  display: flex
  align-items: center
  justify-content: center
  background: linear-gradient(135deg, rgba(var(--admin-accent-rgb), 0.25), rgba(var(--admin-accent-rgb), 0.1))
  color: var(--admin-accent)

.admin-brand-text
  display: flex
  flex-direction: column
  line-height: 1.1

.admin-brand-title
  font-size: 15px
  font-weight: 700
  color: rgba(255, 255, 255, 0.95)

.admin-brand-tagline
  font-size: 11px
  color: rgba(255, 255, 255, 0.55)
  letter-spacing: 0.06em
  text-transform: uppercase

.admin-user-compact
  display: flex
  align-items: center
  gap: 10px
  padding: 6px 10px
  border-radius: 12px
  background: rgba(255, 255, 255, 0.03)
  border: 1px solid rgba(255, 255, 255, 0.06)
  backdrop-filter: var(--admin-glass-blur-light)
  -webkit-backdrop-filter: var(--admin-glass-blur-light)

.admin-user-avatar
  flex-shrink: 0
  transition: transform 0.2s ease

  &:hover
    transform: scale(1.05)

.admin-user-details
  display: flex
  flex-direction: column
  min-width: 0

.admin-user-name
  font-size: 13px
  font-weight: 600
  color: rgba(255, 255, 255, 0.92)
  white-space: nowrap
  overflow: hidden
  text-overflow: ellipsis

.admin-user-role
  font-size: 11px
  color: var(--admin-accent)
  text-transform: uppercase
  letter-spacing: 0.5px

.admin-topbar-center
  display: flex
  justify-content: center
  min-width: 0
  overflow-x: auto

  @media (max-width: 900px)
    justify-content: flex-start

.admin-topbar-right
  display: flex
  align-items: center
  gap: 12px
  justify-content: flex-end

  @media (max-width: 900px)
    justify-content: flex-start

// Admin menu style (match main top bar feel) — custom nav, icon-only items
// that expand their label with a slide-in animation when selected
.admin-topbar-menu
  display: flex
  align-items: center
  flex-shrink: 0

.admin-nav-item
  display: flex
  align-items: center
  justify-content: center
  height: 40px
  padding: 0 8px
  border-radius: 20px
  color: rgba(255, 255, 255, 0.82)
  font-size: 14px
  text-decoration: none
  white-space: nowrap
  flex-shrink: 0
  cursor: pointer
  transition: color 0.3s ease

  &:hover
    color: var(--admin-accent)

  &:focus-visible
    outline: 2px solid var(--admin-accent)
    outline-offset: 2px

.admin-nav-icon
  display: flex
  align-items: center
  justify-content: center

.admin-nav-label
  display: block
  white-space: nowrap
  overflow: hidden
  max-width: 0
  opacity: 0
  margin-left: 0
  transition: max-width 0.3s ease, opacity 0.2s ease, margin 0.3s ease

.admin-nav-item--selected
  color: var(--admin-accent)

  .admin-nav-label
    max-width: 160px
    opacity: 1
    margin-left: 8px

// Main Content
.admin-content
  flex: 1
  display: flex
  flex-direction: column
  min-width: 0
  min-height: 0

.admin-content-body
  flex: 1
  padding: 24px
  overflow-y: auto
  min-height: 0

  @media (min-width: 1024px)
    padding: 32px

// Transitions
.fade-enter-active,
.fade-leave-active
  transition: opacity 0.3s ease

.fade-enter-from,
.fade-leave-to
  opacity: 0
</style>
