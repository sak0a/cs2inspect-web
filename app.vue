<template>
  <ThemeProvider>
    <SpeedInsights />
      <!--<Preloader />-->
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
  </ThemeProvider>
</template>
<script setup lang="ts">
import { SpeedInsights } from "@vercel/speed-insights/nuxt"
</script>