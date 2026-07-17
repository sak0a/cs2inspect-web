<script setup lang="ts">
import { steamAuth } from '~/services/steamAuth'

const router = useRouter()
const config = useRuntimeConfig()
const isDev = import.meta.env.DEV
const devAuthEnabled = computed(() => config.public.devAuthEnabled === true)
const allowDevPage = computed(() => isDev || devAuthEnabled.value)
const loginMessage = ref('')
const loginError = ref('')

onMounted(() => {
  if (!allowDevPage.value) {
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
  <div class="min-h-screen bg-[#121212] p-8 text-white">
    <div class="max-w-5xl mx-auto">
      <h2 class="text-2xl font-bold mb-1">Developer UI Test Page</h2>
      <p class="mb-8 text-gray-400">Environment: {{ isDev ? 'Development' : 'Production' }}</p>

      <div
        v-if="devAuthEnabled"
        class="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 mb-8"
        data-testid="dev-auth-card"
      >
        <h3 class="text-base font-semibold mb-4">Dev Authentication</h3>
        <div class="flex flex-col gap-3">
          <p class="text-gray-400">
            Mock Steam login for local development and AI agents. Requires
            <code class="text-orange-300">DEV_AUTH_ENABLED=true</code> in .env.
          </p>
          <div class="flex gap-3">
            <Button variant="default" data-testid="dev-login-user" @click="handleDevLogin('user')">
              Login as Dev User
            </Button>
            <Button
              variant="default"
              data-testid="dev-login-admin"
              @click="handleDevLogin('admin')"
            >
              Login as Dev Admin
            </Button>
          </div>
          <p v-if="loginMessage" class="text-green-400">{{ loginMessage }}</p>
          <p v-if="loginError" class="text-red-400">{{ loginError }}</p>
        </div>
      </div>

      <div class="flex flex-col gap-6">
        <!-- Original Input Number Section -->
        <h3 class="text-xl font-semibold mt-8">Input Number Styling</h3>
        <div class="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
          <h3 class="text-base font-semibold mb-4">Input Number Styling</h3>
          <div class="flex flex-col gap-3">
            <div class="grid grid-cols-2 gap-8">
              <div>
                <span class="block mb-2">Default Size</span>
                <NumberField v-model="value1">
                  <NumberFieldContent>
                    <NumberFieldDecrement />
                    <NumberFieldInput />
                    <NumberFieldIncrement />
                  </NumberFieldContent>
                </NumberField>
              </div>

              <div>
                <span class="block mb-2">Small Size</span>
                <NumberField v-model="value2">
                  <NumberFieldContent>
                    <NumberFieldDecrement />
                    <NumberFieldInput class="h-8" />
                    <NumberFieldIncrement />
                  </NumberFieldContent>
                </NumberField>
              </div>

              <div>
                <span class="block mb-2">Large Size</span>
                <NumberField v-model="value3">
                  <NumberFieldContent>
                    <NumberFieldDecrement />
                    <NumberFieldInput class="h-11" />
                    <NumberFieldIncrement />
                  </NumberFieldContent>
                </NumberField>
              </div>

              <div>
                <span class="block mb-2">Disabled</span>
                <NumberField :default-value="50" disabled>
                  <NumberFieldContent>
                    <NumberFieldDecrement />
                    <NumberFieldInput />
                    <NumberFieldIncrement />
                  </NumberFieldContent>
                </NumberField>
              </div>
            </div>
          </div>
        </div>

        <div class="glass-card rounded-xl p-6">
          <h3 class="text-base font-semibold mb-4">Glassmorphism Context</h3>
          <div class="flex flex-col gap-3">
            <span>Testing input inside a glass card</span>
            <NumberField v-model="value1">
              <NumberFieldContent>
                <NumberFieldDecrement />
                <NumberFieldInput />
                <NumberFieldIncrement />
              </NumberFieldContent>
            </NumberField>
          </div>
        </div>

        <!-- Glass Button Section -->
        <h3 class="text-xl font-semibold mt-8">Glass Button (Figma Clone)</h3>
        <div class="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
          <h3 class="text-base font-semibold mb-4">SGlassButton Component</h3>
          <!-- Light background to showcase the glass effect -->
          <div class="glass-demo-bg rounded-xl p-12 flex flex-col items-center gap-8">
            <!-- Main example with sparkles icon (matching Figma) -->
            <Button variant="outline" size="lg">
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
            </Button>

            <!-- Size variants -->
            <div class="flex items-center gap-4">
              <Button variant="outline" size="sm">Small</Button>
              <Button variant="outline" size="default">Medium</Button>
              <Button variant="outline" size="lg">Large</Button>
            </div>

            <!-- States -->
            <div class="flex items-center gap-4">
              <Button variant="outline">Normal</Button>
              <Button variant="outline" :loading="true">Loading</Button>
              <Button variant="outline" :disabled="true">Disabled</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
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
