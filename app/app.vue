<template>
  <AppBackground />
  <!-- Route loading bar: accent hairline with a soft glow -->
  <NuxtLoadingIndicator
    :height="2"
    color="#facc15"
    :style="{ boxShadow: '0 0 12px rgba(250, 204, 21, 0.45)' }"
  />
  <!-- Branded intro overlay: plays once per session, self-removes -->
  <SitePreloader />
  <NuxtLayout>
    <NuxtPage :transition="pageTransition" />
  </NuxtLayout>

  <!-- Global toast + confirm hosts (shadcn/vue-sonner) -->
  <ClientOnly>
    <Toaster position="top-center" theme="dark" rich-colors />
  </ClientOnly>
  <ConfirmDialogHost />

  <!-- <SpeedInsights /> -->
</template>
<script setup lang="ts">
import { Toaster } from '@/components/ui/sonner'
import ConfirmDialogHost from '@/components/app/ConfirmDialogHost.vue'
import AppBackground from '@/components/app/AppBackground.vue'
// import { SpeedInsights } from "@vercel/speed-insights/nuxt"

// GSAP JS-hook page transition (css: false) — see usePageTransition.ts
const pageTransition = usePageTransition()
</script>
