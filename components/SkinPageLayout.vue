<script setup lang="ts">
import { NAlert, NButton, NSpin } from 'naive-ui'
import { useLoadoutStore } from '~/stores/loadoutStore'
import type { SteamUser } from "~/services/steamAuth"
import { steamAuth } from "~/services/steamAuth"
import LoadoutSelector from '~/components/LoadoutSelector.vue'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  user: {
    type: Object as () => SteamUser | null,
    required: true
  },
  error: {
    type: String || null,
    default: null
  },
  isLoading: {
    type: Boolean,
    default: false
  }
})

const loadoutStore = useLoadoutStore()

// Expose slot for custom content
</script>

<template>
  <div class="p-2 bg-[#181818]">
    <div class="max-w-7xl mx-auto">
      <!-- Header with Loadout Selector -->
      <div class="flex justify-between mb-2">
        <h1 class="text-2xl font-bold text-white">{{ title }}</h1>
        <LoadoutSelector v-if="user" />
      </div>

      <!-- Error State -->
      <NAlert
          v-if="error"
          type="error"
          :title="error"
          class="mb-6 z-10"
      />

      <!-- Loading State -->
      <div v-else-if="isLoading" class="flex justify-center items-center h-64">
        <NSpin size="large" />
      </div>

      <!-- No Steam Login State -->
      <div v-else-if="!user" class="text-center py-12">
        <p class="text-gray-400 mb-4">Please login with Steam to view and select items</p>
        <NButton type="primary" @click="steamAuth.login()">
          Login with Steam
        </NButton>
      </div>

      <!-- No Loadout Selected State -->
      <div v-else-if="!loadoutStore.selectedLoadoutId" class="text-center py-12">
        <p class="text-gray-400 mb-4">Please select or create a loadout to view {{ title.toLowerCase() }}</p>
        <NButton type="primary" @click="loadoutStore.createLoadout(user.steamId, 'Default Loadout')">
          Create Default Loadout
        </NButton>
      </div>

      <!-- Main Content -->
    </div>
  </div>
</template>