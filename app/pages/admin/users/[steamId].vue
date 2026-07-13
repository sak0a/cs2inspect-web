<script setup lang="ts">
import { LucideArrowLeft as BackIcon, LucidePackage as LoadoutIcon } from '@lucide/vue'
import type { AdminUserDetails } from '~/types'

definePageMeta({
  middleware: 'admin',
  layout: 'admin',
})

// Route and store
const route = useRoute()
const router = useRouter()
const adminStore = useAdminStore()

// State
const user = ref<AdminUserDetails | null>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)

// Modal states
const showBanModal = ref(false)
const showDeleteModal = ref(false)

// Get steam ID from route
const steamId = computed(
  () => ((route.params as Record<string, string | string[]>).steamId as string) ?? ''
)

// Total items computed
const totalItems = computed(() => {
  if (!user.value) return 0
  const counts = user.value.itemCounts
  return (
    counts.weapons + counts.knives + counts.gloves + counts.agents + counts.musicKits + counts.pins
  )
})

// Check for action query param (for deep linking from user list)
onMounted(async () => {
  await fetchUserDetails()

  // Check if we should open ban modal immediately
  if (route.query.action === 'ban' && user.value && !user.value.isBanned) {
    showBanModal.value = true
  }
})

// Fetch user details
async function fetchUserDetails() {
  isLoading.value = true
  error.value = null

  try {
    user.value = await adminStore.fetchUserDetails(steamId.value)
    if (!user.value) {
      error.value = 'User not found'
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load user details'
  } finally {
    isLoading.value = false
  }
}

// Navigate back to users list
function handleBack() {
  router.push('/admin/users')
}

// Handle ban user from card
function handleBanFromCard(_user: AdminUserDetails) {
  showBanModal.value = true
}

// Handle unban user from card
async function handleUnbanFromCard(_user: AdminUserDetails) {
  try {
    await adminStore.unbanUser(steamId.value, { refreshList: false })
    await fetchUserDetails() // Refresh user data
  } catch (err) {
    console.error('Failed to unban user:', err)
  }
}

// Handle delete from card
function handleDeleteFromCard(_user: AdminUserDetails) {
  showDeleteModal.value = true
}

// Handle ban confirmation
async function handleBanConfirm(payload: { reason: string; durationHours?: number }) {
  try {
    await adminStore.banUser(steamId.value, payload.reason, payload.durationHours, {
      refreshList: false,
    })
    await fetchUserDetails() // Refresh user data
  } catch (err) {
    console.error('Failed to ban user:', err)
  }
}

// Handle delete confirmation
async function handleDeleteConfirm() {
  try {
    await adminStore.deleteUserData(steamId.value)
    // Navigate back to users list after deletion
    router.push('/admin/users')
  } catch (err) {
    console.error('Failed to delete user data:', err)
  }
}

// Format date for display
function formatDate(isoDate: string): string {
  const date = new Date(isoDate)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Back Button -->
    <div>
      <SButton variant="ghost" @click="handleBack">
        <template #icon-left>
          <BackIcon :size="16" />
        </template>
        Back to Users
      </SButton>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <NSpin size="large" />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="glass-card p-6 text-center">
      <p class="text-red-400 mb-4">{{ error }}</p>
      <SButton variant="light" @click="fetchUserDetails"> Try Again </SButton>
    </div>

    <!-- User Content -->
    <template v-else-if="user">
      <!-- User Identity & Status Card -->
      <AdminUserCard
        :user="user"
        @ban="handleBanFromCard"
        @unban="handleUnbanFromCard"
        @delete="handleDeleteFromCard"
      />

      <!-- Loadouts & Items Section -->
      <div class="glass-card p-6">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center admin-accent-chip">
            <NIcon :component="LoadoutIcon" :size="20" color="var(--admin-accent)" />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-white">Loadouts & Items</h3>
            <p class="text-sm text-gray-400">
              {{ user.loadoutCount }} loadout{{ user.loadoutCount !== 1 ? 's' : '' }} &middot;
              {{ totalItems }} item{{ totalItems !== 1 ? 's' : '' }}
            </p>
          </div>
        </div>

        <!-- Loadout Summary -->
        <div v-if="user.loadoutCount > 0" class="space-y-4">
          <!-- Item Counts Grid -->
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div class="item-stat-card">
              <span class="item-stat-value">{{ user.itemCounts.weapons }}</span>
              <span class="item-stat-label">Weapons</span>
            </div>
            <div class="item-stat-card">
              <span class="item-stat-value">{{ user.itemCounts.knives }}</span>
              <span class="item-stat-label">Knives</span>
            </div>
            <div class="item-stat-card">
              <span class="item-stat-value">{{ user.itemCounts.gloves }}</span>
              <span class="item-stat-label">Gloves</span>
            </div>
            <div class="item-stat-card">
              <span class="item-stat-value">{{ user.itemCounts.agents }}</span>
              <span class="item-stat-label">Agents</span>
            </div>
            <div class="item-stat-card">
              <span class="item-stat-value">{{ user.itemCounts.musicKits }}</span>
              <span class="item-stat-label">Music Kits</span>
            </div>
            <div class="item-stat-card">
              <span class="item-stat-value">{{ user.itemCounts.pins }}</span>
              <span class="item-stat-label">Pins</span>
            </div>
          </div>

          <!-- Activity Info -->
          <div class="border-t border-white/10 pt-4 mt-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div class="flex items-center gap-2 text-gray-400">
                <span class="opacity-60">First Activity:</span>
                <span class="text-white">{{ formatDate(user.firstActivity) }}</span>
              </div>
              <div class="flex items-center gap-2 text-gray-400">
                <span class="opacity-60">Last Activity:</span>
                <span class="text-white">{{ formatDate(user.lastActivity) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="py-8 text-center">
          <NIcon :component="LoadoutIcon" :size="40" class="opacity-20 mb-3" />
          <p class="text-gray-500">This user has no loadouts.</p>
        </div>
      </div>

      <!-- Individual Loadout Management -->
      <AdminLoadoutTable :steam-id="steamId" />
    </template>

    <!-- Ban Modal -->
    <AdminBanModal
      v-if="user"
      v-model:show="showBanModal"
      :steam-id="steamId"
      @confirm="handleBanConfirm"
      @cancel="showBanModal = false"
    />

    <!-- Delete Modal -->
    <AdminDeleteModal
      v-if="user"
      v-model:show="showDeleteModal"
      :steam-id="steamId"
      @confirm="handleDeleteConfirm"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>

<style scoped lang="sass">
.glass-card
  background: var(--admin-glass-bg)
  backdrop-filter: var(--admin-glass-blur)
  -webkit-backdrop-filter: var(--admin-glass-blur)
  border: 1px solid var(--admin-glass-border)
  border-radius: 14px
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15), var(--admin-glass-inset)
  transition: border-color 0.3s ease

  &:hover
    border-color: var(--admin-glass-border-hover)

.admin-accent-chip
  background: linear-gradient(135deg, rgba(var(--admin-accent-rgb), 0.2), rgba(var(--admin-accent-rgb), 0.1))
  color: var(--admin-accent)

.item-stat-card
  display: flex
  flex-direction: column
  align-items: center
  padding: 16px
  background: rgba(255, 255, 255, 0.02)
  border-radius: 10px
  border: 1px solid rgba(255, 255, 255, 0.05)
  transition: all 0.2s ease
  backdrop-filter: var(--admin-glass-blur-light)
  -webkit-backdrop-filter: var(--admin-glass-blur-light)

  &:hover
    background: rgba(255, 255, 255, 0.04)
    border-color: rgba(255, 255, 255, 0.08)

.item-stat-value
  font-size: 24px
  font-weight: 700
  color: rgba(255, 255, 255, 0.95)
  font-variant-numeric: tabular-nums

.item-stat-label
  font-size: 12px
  color: rgba(255, 255, 255, 0.5)
  margin-top: 4px
  text-transform: uppercase
  letter-spacing: 0.5px
</style>
