<template>
  <AppBackground />
  <!-- <Preloader /> -->
  <NuxtLayout>
    <NuxtPage />
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
</script>
