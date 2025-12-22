<script setup lang="ts">

const router = useRouter()
const isDev = import.meta.env.DEV

// Access control: Redirect if not in development
onMounted(() => {
  if (!import.meta.env.DEV) {
    router.replace('/')
  }
})

const value1 = ref(0)
const value2 = ref(100)
const value3 = ref(5)
</script>

<template>
  <ThemeProvider>
    <div class="min-h-screen bg-[#121212] p-8 text-white">
      <div class="max-w-4xl mx-auto">
        <n-h2>Developer UI Test Page</n-h2>
        <p class="mb-8 text-gray-400">Environment: {{ isDev ? 'Development' : 'Production' }}</p>

        <n-space vertical size="large">
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
</style>
