<template>
  <ThemeProvider>
      <!-- <Preloader /> -->
    <NuxtLayout>
      <NuxtPage />
      <SpeedInsights />
    </NuxtLayout>
  </ThemeProvider>
</template>
<script setup lang="ts">
import { SpeedInsights } from "@vercel/speed-insights/nuxt"
</script>