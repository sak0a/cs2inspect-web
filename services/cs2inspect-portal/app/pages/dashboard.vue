<template>
  <div class="min-h-screen bg-gray-950">
    <AppNavbar />

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
      <!-- Page header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-white">Dashboard</h1>
        <p class="mt-1 text-gray-400 text-sm">Manage your server licenses and subscription.</p>
      </div>

      <!-- Trial banner -->
      <div v-if="!auth.customer?.trialused" class="mb-8">
        <DashboardTrialBanner @started="onTrialStarted" />
      </div>

      <!-- Licenses section -->
      <div>
        <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Your Licenses</h2>

        <div v-if="pending" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="n in 2"
            :key="n"
            class="rounded-2xl bg-gray-900 border border-gray-800 p-6 h-[260px] animate-pulse"
          />
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <DashboardLicenseCard
            v-for="license in licenses"
            :key="license.id"
            :license="license"
            @rebound="refresh"
          />
          <DashboardAddLicenseCard />
        </div>

        <p v-if="!pending && licenses && licenses.length === 0" class="text-gray-500 text-sm mt-2">
          You don't have any licenses yet. Activate your free trial or purchase a plan to get started.
        </p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const auth = useAuthStore()
const { data: licenses, pending, refresh } = await useFetch('/api/licenses')

async function onTrialStarted() {
  await auth.fetchUser()
  await refresh()
}

useSeoMeta({
  title: 'Dashboard — CS2Inspect',
})
</script>
