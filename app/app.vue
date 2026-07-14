<template>
  <ThemeProvider>
    <div class="absolute inset-0 z-0" :style="backgroundStyle" />
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
  </ThemeProvider>
</template>
<script setup lang="ts">
import { Toaster } from '@/components/ui/sonner'
import ConfirmDialogHost from '@/components/app/ConfirmDialogHost.vue'

const backgroundStyle = {
  background: '#000000',
  backgroundImage: `
        radial-gradient(circle, rgba(255, 255, 255, 0.2) 1.5px, transparent 1.5px)
      `,
  backgroundSize: '40px 40px',
  backgroundPosition: '0 0',
  maskImage: 'linear-gradient(to bottom right, black 10%, transparent 100%)',
  WebkitMaskImage: 'linear-gradient(to bottom right, black 10%, transparent 100%)',
}
// import { SpeedInsights } from "@vercel/speed-insights/nuxt"
</script>
