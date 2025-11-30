<script setup lang="ts">
import { NAlert, NButton, NSpin } from 'naive-ui'
import { useLoadoutStore } from '~/stores/loadoutStore'
import type { SteamUser } from "~/services/steamAuth"
import { steamAuth } from "~/services/steamAuth"
defineProps({
  title: {
    type: String,
    required: true
  },
  user: {
    type: Object as () => SteamUser | null,
    required: false,
    default: null
  },
  error: {
    type: String,
    default: null
  },
  isLoading: {
    type: Boolean,
    default: false
  }
})

const { t } = useI18n()
const loadoutStore = useLoadoutStore()

// Expose slot for custom content
</script>

<template>
  <div class="max-w-7xl mx-auto">


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
        <p class="text-gray-400 mb-4">{{ t('auth.loginRequired') }}</p>
        <NButton type="primary" @click="steamAuth.login()">
          {{ t('auth.login') }}
        </NButton>
      </div>

      <!-- No Loadout Selected State -->
      <div v-else-if="!loadoutStore.selectedLoadoutId" class="text-center py-12">
        <p class="text-gray-400 mb-4">Please select or create a loadout to view {{ title.toLowerCase() }}</p>
        <NButton type="primary" @click="loadoutStore.createLoadout(user.steamId, 'Default Loadout')">
          {{ t('loadout.createDefault') }}
        </NButton>
      </div>

      <!-- Main Content -->
    </div>
</template>

<style scoped>

</style>