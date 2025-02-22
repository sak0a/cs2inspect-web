<script setup lang="ts">
import { darkTheme, NConfigProvider } from 'naive-ui'
</script>

<template>
  <NConfigProvider :theme="darkTheme" inline-theme-disabled>
    <NLoadingBarProvider>
      <NModalProvider>
        <NDialogProvider>
          <NMessageProvider>
            <slot/>
          </NMessageProvider>
        </NDialogProvider>
      </NModalProvider>
    </NLoadingBarProvider>
  </NConfigProvider>
</template>

<style scoped>

</style>