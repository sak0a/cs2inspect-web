<template>
  <div class="min-h-screen bg-gray-950">
    <AppNavbar />
    <HeroSection />
    <FeaturesSection />
    <PricingSection />
    <HowItWorks />
    <FaqSection />

    <!-- Footer -->
    <footer class="bg-gray-950 border-t border-gray-800 py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col md:flex-row items-center justify-between gap-4">
          <div class="text-xl font-bold text-white">
            CS2<span class="text-blue-500">Inspect</span>
          </div>
          <div class="flex items-center gap-6 text-sm text-gray-500">
            <a href="#features" class="hover:text-gray-300 transition-colors">Features</a>
            <a href="#pricing" class="hover:text-gray-300 transition-colors">Pricing</a>
            <a href="#faq" class="hover:text-gray-300 transition-colors">FAQ</a>
          </div>
          <p class="text-sm text-gray-600">
            &copy; {{ new Date().getFullYear() }} CS2Inspect. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
const authStore = useAuthStore()

await authStore.fetchUser()

if (authStore.isAuthenticated) {
  await navigateTo('/dashboard')
}

useSeoMeta({
  title: 'CS2Inspect — Weapon Skins for Your CS2 Server',
  description: 'Let your players customize weapons, knives, gloves, and more. Easy to set up, affordable to run.',
})
</script>
