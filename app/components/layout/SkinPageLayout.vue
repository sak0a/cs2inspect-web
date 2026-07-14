<script setup lang="ts">
import { LucideCircleAlert } from '@lucide/vue'
import type { SteamUser } from '~/services/steamAuth'
import { toSteamId } from '~/types/core/branded'
import { steamAuth } from '~/services/steamAuth'
interface Props {
  title: string
  user?: SteamUser | null
  error?: string | null
  isLoading?: boolean
}

const _props = withDefaults(defineProps<Props>(), {
  user: null,
  error: null,
  isLoading: false,
})

const { t } = useI18n()
const loadoutStore = useLoadoutStore()

// Expose slot for custom content
</script>

<template>
  <div class="max-w-7xl mx-auto">
    <!-- Error State -->
    <Alert v-if="error" variant="destructive" class="mb-6 z-10">
      <LucideCircleAlert />
      <AlertTitle>{{ error }}</AlertTitle>
    </Alert>

    <!-- Loading State -->
    <div v-else-if="isLoading" class="flex justify-center items-center h-64">
      <Spinner class="size-10 text-primary" />
    </div>

    <!-- No Steam Login State -->
    <div v-else-if="!user" class="text-center py-12">
      <p class="text-gray-400 mb-4">{{ t('auth.loginRequired') }}</p>
      <Button variant="default" @click="steamAuth.login()">
        {{ t('auth.login') }}
      </Button>
    </div>

    <!-- No Loadout Selected State -->
    <div v-else-if="!loadoutStore.selectedLoadoutId" class="text-center py-12">
      <p class="text-gray-400 mb-4">
        Please select or create a loadout to view {{ title.toLowerCase() }}
      </p>
      <Button
        variant="default"
        @click="loadoutStore.createLoadout(toSteamId(user.steamId), 'Default Loadout')"
      >
        {{ t('loadout.createDefault') }}
      </Button>
    </div>

    <!-- Main Content -->
  </div>
</template>

<style scoped></style>
