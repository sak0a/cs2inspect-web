<script setup lang="ts">
import { steamAuth } from '~/services/steamAuth'

const router = useRouter()
const config = useRuntimeConfig()
const isDev = import.meta.env.DEV
const devAuthEnabled = computed(() => config.public.devAuthEnabled === true)
const loginMessage = ref('')
const loginError = ref('')

// Access control: Redirect if not in development
onMounted(() => {
  if (!import.meta.env.DEV) {
    router.replace('/')
  }
})

async function handleDevLogin(as: 'user' | 'admin') {
  loginMessage.value = ''
  loginError.value = ''

  try {
    const user = await steamAuth.devLogin(as)
    loginMessage.value = `Logged in as ${user.personaName} (${user.steamId})`
    await navigateTo('/')
  } catch (error: unknown) {
    loginError.value = error instanceof Error ? error.message : 'Dev login failed'
  }
}

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

        <n-card v-if="devAuthEnabled" title="Dev Authentication" class="bg-[#1a1a1a] border-gray-800 mb-8">
          <n-space vertical>
            <p class="text-gray-400">
              Mock Steam login for local development and AI agents. Requires
              <code class="text-orange-300">DEV_AUTH_ENABLED=true</code> in .env.
            </p>
            <n-space>
              <n-button type="primary" @click="handleDevLogin('user')">Login as Dev User</n-button>
              <n-button type="warning" @click="handleDevLogin('admin')">Login as Dev Admin</n-button>
            </n-space>
            <p v-if="loginMessage" class="text-green-400">{{ loginMessage }}</p>
            <p v-if="loginError" class="text-red-400">{{ loginError }}</p>
          </n-space>
        </n-card>

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
