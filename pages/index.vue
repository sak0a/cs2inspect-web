<script setup lang="ts">
import { NThemeEditor } from "naive-ui";




//const colorMode = useColorMode()
</script>
<template>
  <div>
    <div class="flex justify-center items-center h-screen">
      <div class="flex flex-col items-center">
        <h1 class="text-4xl font-bold">Share</h1>
        <div class="flex space-x-4 mt-4">
          <NuxtLink to="/snippet" class="bg-amber-500">Code</NuxtLink>
          <NuxtLink to="/file" class="px-4 py-2 rounded-md bg-gray-200 text-gray-800">
          <button class="px-4 py-2 rounded-md">
            File
          </button>
          </NuxtLink>
          <lazy-client-only>
            <NThemeEditor />
          </lazy-client-only>
        </div>
      </div>
    </div>
    </div>
</template>

<style lang="sass" scoped>

</style>