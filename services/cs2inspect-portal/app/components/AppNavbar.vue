<template>
  <nav class="fixed top-0 left-0 right-0 z-50 bg-gray-950/90 backdrop-blur-sm border-b border-gray-800">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <div class="flex items-center gap-8">
          <NuxtLink to="/" class="text-xl font-bold text-white tracking-tight">
            CS2<span class="text-blue-500">Inspect</span>
          </NuxtLink>

          <!-- Nav links -->
          <div class="hidden md:flex items-center gap-6">
            <template v-if="!authStore.isAuthenticated">
              <a href="#features" class="text-sm text-gray-400 hover:text-white transition-colors">Features</a>
              <a href="#pricing" class="text-sm text-gray-400 hover:text-white transition-colors">Pricing</a>
              <a href="#how-it-works" class="text-sm text-gray-400 hover:text-white transition-colors">How It Works</a>
            </template>
            <template v-else>
              <NuxtLink to="/dashboard" class="text-sm text-gray-400 hover:text-white transition-colors">Dashboard</NuxtLink>
              <NuxtLink to="/setup" class="text-sm text-gray-400 hover:text-white transition-colors">Setup Guide</NuxtLink>
              <NuxtLink to="/settings" class="text-sm text-gray-400 hover:text-white transition-colors">Settings</NuxtLink>
            </template>
          </div>
        </div>

        <!-- Right side -->
        <div class="flex items-center gap-3">
          <template v-if="!authStore.isAuthenticated">
            <a
              :href="steamLoginUrl"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-medium transition-colors"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.187.006l2.86-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.253 0-2.265-1.014-2.265-2.265z"/>
              </svg>
              Login with Steam
            </a>
          </template>
          <template v-else>
            <div class="flex items-center gap-3">
              <img
                v-if="authStore.customer?.avatarUrl"
                :src="authStore.customer.avatarUrl"
                :alt="authStore.customer.displayName || 'Avatar'"
                class="w-8 h-8 rounded-full border border-gray-700"
              />
              <span class="text-sm text-gray-300 hidden sm:block">{{ authStore.customer?.displayName }}</span>
              <button
                class="text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5 rounded border border-gray-700 hover:border-gray-500"
                @click="authStore.logout()"
              >
                Logout
              </button>
            </div>
          </template>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
const authStore = useAuthStore()
const config = useRuntimeConfig()

const steamLoginUrl = computed(() => {
  const returnTo = encodeURIComponent(`${config.public.portalBaseUrl}/api/auth/steam-validate`)
  return `https://steamcommunity.com/openid/login?openid.mode=checkid_setup&openid.ns=http://specs.openid.net/auth/2.0&openid.claimed_id=http://specs.openid.net/auth/2.0/identifier_select&openid.identity=http://specs.openid.net/auth/2.0/identifier_select&openid.return_to=${returnTo}`
})
</script>
