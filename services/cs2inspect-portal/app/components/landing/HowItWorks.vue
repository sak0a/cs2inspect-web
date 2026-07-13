<template>
  <section id="how-it-works" class="py-24 bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-16">
        <h2 class="text-4xl font-bold text-white mb-4">Up and Running in Minutes</h2>
        <p class="text-lg text-gray-400">Three simple steps to bring weapon customization to your server.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto relative">
        <!-- Connector line (desktop) -->
        <div class="hidden md:block absolute top-10 left-1/3 right-1/3 h-px bg-gradient-to-r from-blue-500/50 to-blue-500/50 via-blue-500" />

        <div
          v-for="(step, index) in steps"
          :key="step.title"
          class="relative flex flex-col items-center text-center p-6"
        >
          <!-- Step number -->
          <div class="relative z-10 w-20 h-20 rounded-2xl bg-gray-950 border-2 border-blue-500/50 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/10">
            <span class="text-3xl">{{ step.icon }}</span>
            <div class="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
              {{ index + 1 }}
            </div>
          </div>
          <h3 class="text-lg font-semibold text-white mb-3">{{ step.title }}</h3>
          <p class="text-sm text-gray-400 leading-relaxed">{{ step.description }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const steps = [
  {
    icon: '👤',
    title: 'Sign Up',
    description: 'Create your account by logging in with your Steam ID. No email or password required.',
  },
  {
    icon: '🔑',
    title: 'Get Your Key',
    description: 'Purchase a license and receive your activation key instantly. Available for 30, 90, or 365 days.',
  },
  {
    icon: '🚀',
    title: 'Activate',
    description: 'Add the license key to your plugin configuration file and restart your server. That\'s it.',
  },
]
</script>
