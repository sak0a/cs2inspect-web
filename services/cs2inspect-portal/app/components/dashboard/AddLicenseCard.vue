<template>
  <button
    class="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-700 hover:border-gray-500 hover:bg-gray-900/50 transition-all p-6 min-h-[260px] w-full text-center group"
    @click="navigateTo('/buy')"
  >
    <div class="w-12 h-12 rounded-xl bg-gray-800 group-hover:bg-gray-700 border border-gray-700 group-hover:border-gray-600 flex items-center justify-center mb-4 transition-colors">
      <svg class="w-6 h-6 text-gray-400 group-hover:text-gray-200 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    </div>
    <div class="text-base font-semibold text-gray-300 group-hover:text-white transition-colors mb-1">
      Add Server License
    </div>
    <div class="text-sm text-gray-500 group-hover:text-gray-400 transition-colors">
      15% multi-server discount
    </div>
  </button>
</template>

<script setup lang="ts">
</script>
