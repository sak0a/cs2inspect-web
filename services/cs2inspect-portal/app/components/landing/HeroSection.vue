<template>
  <section class="relative min-h-screen flex items-center justify-center overflow-hidden bg-gray-950">
    <!-- Background gradient -->
    <div class="absolute inset-0 bg-gradient-to-br from-blue-950/30 via-gray-950 to-gray-950 pointer-events-none" />
    <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

    <div class="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-24 pb-20">
      <!-- Badge -->
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-8">
        <span class="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
        CS2 Server Plugin
      </div>

      <h1 class="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight tracking-tight mb-6">
        Weapon Skins for
        <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400"> Your CS2 Server</span>
      </h1>

      <p class="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
        Let your players customize weapons, knives, gloves, and more.
        Easy to set up, affordable to run.
      </p>

      <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
        <a
          :href="steamLoginUrl"
          class="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-lg transition-all hover:shadow-lg hover:shadow-blue-500/25 active:scale-95"
        >
          Start Free Trial
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </a>
        <a
          href="#pricing"
          class="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white font-semibold text-lg transition-colors"
        >
          View Pricing
        </a>
      </div>

      <!-- Stats -->
      <div class="mt-16 pt-16 border-t border-gray-800 grid grid-cols-3 gap-8 max-w-xl mx-auto">
        <div>
          <div class="text-3xl font-bold text-white">3-day</div>
          <div class="text-sm text-gray-500 mt-1">Free Trial</div>
        </div>
        <div>
          <div class="text-3xl font-bold text-white">€2.50</div>
          <div class="text-sm text-gray-500 mt-1">Starting/mo</div>
        </div>
        <div>
          <div class="text-3xl font-bold text-white">5 min</div>
          <div class="text-sm text-gray-500 mt-1">Setup time</div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const config = useRuntimeConfig()

const steamLoginUrl = computed(() => {
  const returnTo = encodeURIComponent(`${config.public.portalBaseUrl}/api/auth/steam-validate`)
  return `https://steamcommunity.com/openid/login?openid.mode=checkid_setup&openid.ns=http://specs.openid.net/auth/2.0&openid.claimed_id=http://specs.openid.net/auth/2.0/identifier_select&openid.identity=http://specs.openid.net/auth/2.0/identifier_select&openid.return_to=${returnTo}`
})
</script>
