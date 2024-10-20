<script setup lang="ts">
import { darkTheme, NConfigProvider } from 'naive-ui'
</script>

<template>
  <n-config-provider :theme="darkTheme">
    <slot></slot>
  </n-config-provider>
</template>

<style scoped>

</style>