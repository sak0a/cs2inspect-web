<script setup lang="ts">
const router = useRouter()
const isDev = import.meta.env.DEV

// Access control: Redirect if not in development
onMounted(() => {
  if (!import.meta.env.DEV) {
    router.replace('/')
  }
})

// Input number demo values
const value1 = ref(0)
const value2 = ref(100)
const value3 = ref(5)
</script>

<template>
  <ThemeProvider>
    <div class="min-h-screen bg-[#121212] p-8 text-white">
      <div class="max-w-5xl mx-auto">
        <n-h2>Developer UI Test Page</n-h2>
        <p class="mb-8 text-gray-400">Environment: {{ isDev ? 'Development' : 'Production' }}</p>

        <n-space vertical size="large">
          <!-- Original Input Number Section -->
          <n-h3 class="mt-8">Input Number Styling</n-h3>
          <n-card title="Input Number Styling" class="bg-[#1a1a1a] border-gray-800">
            <n-space vertical>
              <div class="grid grid-cols-2 gap-8">
                <div>
                  <n-text class="block mb-2">Default Size</n-text>
                  <n-input-number v-model:value="value1" />
                </div>

                <div>
                  <n-text class="block mb-2">Small Size</n-text>
                  <n-input-number v-model:value="value2" size="small" />
                </div>

                <div>
                  <n-text class="block mb-2">Large Size</n-text>
                  <n-input-number v-model:value="value3" size="large" />
                </div>

                <div>
                  <n-text class="block mb-2">Disabled</n-text>
                  <n-input-number :value="50" disabled />
                </div>
              </div>
            </n-space>
          </n-card>

          <n-card title="Glassmorphism Context" class="glass-card">
            <n-space vertical>
              <n-text>Testing input inside a glass card</n-text>
              <n-input-number v-model:value="value1" />
            </n-space>
          </n-card>

          <!-- Glass Button Section -->
          <n-h3 class="mt-8">Glass Button (Figma Clone)</n-h3>
          <n-card title="SGlassButton Component" class="bg-[#1a1a1a] border-gray-800">
            <!-- Light background to showcase the glass effect -->
            <div class="glass-demo-bg rounded-xl p-12 flex flex-col items-center gap-8">
              <!-- Main example with sparkles icon (matching Figma) -->
              <SGlassButton size="lg">
                <template #icon-left>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path
                      d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"
                    />
                    <path d="M20 3v4" />
                    <path d="M22 5h-4" />
                    <path d="M4 17v2" />
                    <path d="M5 18H3" />
                  </svg>
                </template>
                Generate
              </SGlassButton>

              <!-- Size variants -->
              <div class="flex items-center gap-4">
                <SGlassButton size="sm">Small</SGlassButton>
                <SGlassButton size="md">Medium</SGlassButton>
                <SGlassButton size="lg">Large</SGlassButton>
              </div>

              <!-- States -->
              <div class="flex items-center gap-4">
                <SGlassButton>Normal</SGlassButton>
                <SGlassButton :loading="true">Loading</SGlassButton>
                <SGlassButton :disabled="true">Disabled</SGlassButton>
              </div>
            </div>
          </n-card>
        </n-space>
      </div>
    </div>
  </ThemeProvider>
</template>

<style scoped>
.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Light gradient background to showcase glass button effect */
.glass-demo-bg {
  background: linear-gradient(135deg, #e8e8e8 0%, #d4d4d4 50%, #c0c0c0 100%);
  position: relative;
}

/* Add subtle noise texture */
.glass-demo-bg::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  opacity: 0.03;
  pointer-events: none;
  border-radius: inherit;
}
</style>
