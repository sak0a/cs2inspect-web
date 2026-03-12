<script setup lang="ts"></script>

<template>
  <div class="flex-shrink-0 w-full sticky top-0 z-40">
    <aside class="text-white s-sider-glass s-sider-glass--top">
      <div class="flex flex-row items-center overflow-x-auto overflow-y-hidden w-full">
        <slot />
      </div>
    </aside>
  </div>
</template>

<style scoped lang="sass">
.s-sider-glass
  background: rgba(0, 0, 0, 0.15)
  backdrop-filter: blur(12px)
  -webkit-backdrop-filter: blur(12px)
</style>
