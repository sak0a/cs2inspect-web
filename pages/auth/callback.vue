<script setup lang="ts">
import { onMounted } from 'vue'
import { steamAuth } from '@/services/steamAuth'

onMounted(async () => {
  try {
    const params = Object.fromEntries(new URLSearchParams(window.location.search))
    const isValid = await steamAuth.validateLogin(params)

    if (isValid) {
      const steamId = steamAuth.extractSteamId(params)
      if (steamId) {
        const userInfo = await steamAuth.getUserInfo(steamId)
        steamAuth.saveUser(userInfo)
      }
    }

    // Use navigate instead of direct window.location change
    await navigateTo('/')
  } catch (error) {
    console.error('Authentication error:', error)
    await navigateTo('/') // Navigate home even on error
  }
})
</script>

<template>
  <div class="flex items-center justify-center min-h-screen">
    <p>Authenticating...</p>
  </div>
</template>