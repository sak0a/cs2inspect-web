<script setup lang="ts">
import {
    LucideLayoutDashboard as DashboardIcon,
    LucideUsers as UsersIcon,
    LucideSettings as SettingsIcon,
    LucideActivity as ActivityIcon,
    LucideShield as ShieldIcon,
    LucidePlug as PlugIcon,
    LucideMenu as MenuIcon,
    LucideX as CloseIcon,
    LucideArrowLeft as BackIcon,
} from 'lucide-vue-next'
import { useAdminAuth } from '~/composables/useAdminAuth'

// Props
interface Props {
    /** Title displayed in the header */
    title?: string
}

withDefaults(defineProps<Props>(), {
    title: 'Admin Panel',
})

// Admin auth
const { isSuperAdmin } = useAdminAuth()

// Mobile sidebar state
const isMobileSidebarOpen = ref(false)

// Navigation items
const navigationItems = computed(() => {
    const items = [
        { key: 'dashboard', label: 'Dashboard', icon: DashboardIcon, path: '/admin' },
        { key: 'users', label: 'Users', icon: UsersIcon, path: '/admin/users' },
        { key: 'settings', label: 'Settings', icon: SettingsIcon, path: '/admin/settings' },
        { key: 'activity', label: 'Activity Log', icon: ActivityIcon, path: '/admin/activity' },
    ]

    // Add superadmin-only pages
    if (isSuperAdmin.value) {
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

// Get current route for active state
const route = useRoute()

// Check if a route is active
function isActiveRoute(path: string): boolean {
    if (path === '/admin') {
        return route.path === '/admin' || route.path === '/admin/'
    }
    return route.path.startsWith(path)
}

// Toggle mobile sidebar
function toggleMobileSidebar() {
    isMobileSidebarOpen.value = !isMobileSidebarOpen.value
}

// Close mobile sidebar
function closeMobileSidebar() {
    isMobileSidebarOpen.value = false
}
</script>

<template>
    <div class="admin-layout">
        <!-- Mobile Header -->
        <header class="admin-mobile-header">
            <NButton quaternary circle size="large" @click="toggleMobileSidebar">
                <template #icon>
                    <NIcon :component="MenuIcon" />
                </template>
            </NButton>
            <h1 class="text-lg font-semibold">{{ title }}</h1>
            <NButton quaternary circle size="large" tag="a" href="/">
                <template #icon>
                    <NIcon :component="BackIcon" />
                </template>
            </NButton>
        </header>

        <!-- Mobile Sidebar Overlay -->
        <Transition name="fade">
            <div
                v-if="isMobileSidebarOpen"
                class="admin-sidebar-overlay"
                @click="closeMobileSidebar"
            />
        </Transition>

        <!-- Sidebar -->
        <aside class="admin-sidebar" :class="{ 'admin-sidebar--open': isMobileSidebarOpen }">
            <!-- Sidebar Header -->
            <div class="admin-sidebar-header">
                <NSpace align="center" :size="12">
                    <NIcon :component="ShieldIcon" :size="24" color="var(--primary-color)" />
                    <span class="text-lg font-bold">Admin Panel</span>
                </NSpace>
                <NButton
                    quaternary
                    circle
                    size="small"
                    class="admin-sidebar-close"
                    @click="closeMobileSidebar"
                >
                    <template #icon>
                        <NIcon :component="CloseIcon" />
                    </template>
                </NButton>
            </div>

            <!-- Navigation -->
            <nav class="admin-sidebar-nav">
                <NuxtLink
                    v-for="item in navigationItems"
                    :key="item.key"
                    :to="item.path"
                    class="admin-nav-item"
                    :class="{ 'admin-nav-item--active': isActiveRoute(item.path) }"
                    @click="closeMobileSidebar"
                >
                    <NIcon :component="item.icon" :size="20" />
                    <span>{{ item.label }}</span>
                </NuxtLink>
            </nav>

            <!-- Back to Site -->
            <div class="admin-sidebar-footer">
                <NuxtLink to="/" class="admin-nav-item admin-nav-item--secondary">
                    <NIcon :component="BackIcon" :size="20" />
                    <span>Back to Site</span>
                </NuxtLink>
            </div>
        </aside>

        <!-- Main Content -->
        <main class="admin-content">
            <!-- Desktop Header -->
            <header class="admin-desktop-header">
                <h1 class="text-2xl font-bold">{{ title }}</h1>
            </header>

            <!-- Content Slot -->
            <div class="admin-content-body">
                <slot />
            </div>
        </main>
    </div>
</template>

<style scoped lang="sass">
.admin-layout
  display: flex
  min-height: 100vh
  height: 100vh
  overflow: hidden
  background: #0a0a0a
  color: var(--text-primary)
  --admin-accent: var(--primary-color)
  --admin-accent-rgb: 250, 204, 21
  --admin-glass-bg: rgba(0, 0, 0, 0.35)
  --admin-glass-bg-strong: rgba(0, 0, 0, 0.55)

// Mobile Header
.admin-mobile-header
  display: flex
  align-items: center
  justify-content: space-between
  padding: 16px
  background: var(--admin-glass-bg-strong)
  backdrop-filter: var(--glass-blur-medium) var(--glass-saturation)
  -webkit-backdrop-filter: var(--glass-blur-medium) var(--glass-saturation)
  border-bottom: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08))
  position: fixed
  top: 0
  left: 0
  right: 0
  z-index: 100

  @media (min-width: 1024px)
    display: none

// Sidebar Overlay (mobile)
.admin-sidebar-overlay
  position: fixed
  inset: 0
  background: rgba(0, 0, 0, 0.6)
  z-index: 199

  @media (min-width: 1024px)
    display: none

// Sidebar
.admin-sidebar
  width: 280px
  min-height: 100vh
  display: flex
  flex-direction: column
  backdrop-filter: var(--glass-blur-strong) var(--glass-saturation)
  -webkit-backdrop-filter: var(--glass-blur-strong) var(--glass-saturation)
  background: var(--admin-glass-bg)
  border-right: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08))
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.3)

  // Mobile: Off-canvas
  @media (max-width: 1023px)
    position: fixed
    top: 0
    left: 0
    bottom: 0
    z-index: 200
    transform: translateX(-100%)
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)

    &--open
      transform: translateX(0)

  // Desktop: Static
  @media (min-width: 1024px)
    position: sticky
    top: 0

.admin-sidebar-header
  display: flex
  align-items: center
  justify-content: space-between
  padding: 24px 20px
  border-bottom: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08))

.admin-sidebar-close
  @media (min-width: 1024px)
    display: none

.admin-sidebar-nav
  flex: 1
  padding: 16px 12px
  display: flex
  flex-direction: column
  gap: 4px

.admin-sidebar-footer
  padding: 16px 12px
  border-top: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08))

// Navigation Items
.admin-nav-item
  display: flex
  align-items: center
  gap: 12px
  padding: 12px 16px
  border-radius: 10px
  color: rgba(255, 255, 255, 0.7)
  text-decoration: none
  transition: all 0.2s ease

  &:hover
    background: rgba(255, 255, 255, 0.08)
    color: rgba(255, 255, 255, 0.95)

  &--active
    background: linear-gradient(135deg, rgba(var(--admin-accent-rgb), 0.2), rgba(var(--admin-accent-rgb), 0.1))
    color: var(--admin-accent)
    border-left: 3px solid var(--admin-accent)
    margin-left: -3px

    &:hover
      background: linear-gradient(135deg, rgba(var(--admin-accent-rgb), 0.25), rgba(var(--admin-accent-rgb), 0.15))

  &--secondary
    color: rgba(255, 255, 255, 0.5)

    &:hover
      color: rgba(255, 255, 255, 0.8)

// Main Content
.admin-content
  flex: 1
  display: flex
  flex-direction: column
  min-width: 0
  min-height: 0

  @media (max-width: 1023px)
    padding-top: 64px // Account for mobile header

.admin-desktop-header
  display: none
  padding: 24px 32px
  border-bottom: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08))
  background: var(--admin-glass-bg)
  backdrop-filter: var(--glass-blur-medium) var(--glass-saturation)
  -webkit-backdrop-filter: var(--glass-blur-medium) var(--glass-saturation)

  @media (min-width: 1024px)
    display: block

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
