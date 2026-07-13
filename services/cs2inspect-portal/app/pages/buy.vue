<template>
  <div class="min-h-screen bg-gray-950">
    <AppNavbar />

    <main class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
      <!-- Payment result banners -->
      <div v-if="paymentStatus === 'success'" class="mb-8 flex items-start gap-3 rounded-xl bg-green-900/30 border border-green-700/40 px-5 py-4">
        <svg class="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        <div>
          <div class="text-green-300 font-semibold">Payment successful</div>
          <div class="text-green-400/80 text-sm mt-0.5">Your license has been extended. Head to your dashboard to see the updated expiry.</div>
        </div>
      </div>

      <div v-if="paymentStatus === 'cancelled'" class="mb-8 flex items-start gap-3 rounded-xl bg-yellow-900/30 border border-yellow-700/40 px-5 py-4">
        <svg class="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <div class="text-yellow-300 font-semibold">Payment cancelled</div>
          <div class="text-yellow-400/80 text-sm mt-0.5">Your payment was cancelled. You can try again below.</div>
        </div>
      </div>

      <!-- Page header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-white">Buy More Time</h1>
        <p class="mt-1 text-gray-400 text-sm">Extend your license with one of the plans below.</p>
      </div>

      <!-- License selector -->
      <div v-if="licenses && licenses.length > 0" class="mb-8">
        <label class="block text-sm font-medium text-gray-400 mb-2">Select License</label>
        <select
          v-model="selectedLicenseId"
          class="w-full rounded-xl bg-gray-900 border border-gray-700 text-white text-sm px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors"
        >
          <option v-for="license in licenses" :key="license.id" :value="license.id">
            License #{{ license.id }} — {{ license.licensekey }} ({{ license.status }})
          </option>
        </select>
      </div>

      <!-- Plan cards -->
      <div class="mb-8">
        <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Choose a Plan</h2>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <BuyPlanCard
            v-for="plan in plans"
            :key="plan.plan"
            v-bind="plan"
            :selected="selectedPlan === plan.plan"
            @select="selectedPlan = plan.plan"
          />
        </div>
      </div>

      <!-- Payment buttons -->
      <div class="flex flex-col sm:flex-row gap-3">
        <button
          :disabled="!canCheckout || checkoutLoading === 'stripe'"
          class="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
          @click="checkout('stripe')"
        >
          <svg v-if="checkoutLoading === 'stripe'" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <svg v-else class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
          </svg>
          Pay with Stripe
        </button>

        <button
          :disabled="!canCheckout || checkoutLoading === 'paypal'"
          class="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 font-semibold text-sm transition-colors"
          @click="checkout('paypal')"
        >
          <svg v-if="checkoutLoading === 'paypal'" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <svg v-else class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z"/>
          </svg>
          Pay with PayPal
        </button>
      </div>

      <p v-if="checkoutError" class="mt-4 text-red-400 text-sm">{{ checkoutError }}</p>

      <p class="mt-4 text-gray-600 text-xs text-center">
        Payments are processed securely. Time is added to the selected license immediately after payment.
      </p>
    </main>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const { data: licenses } = await useFetch('/api/licenses')

const plans = [
  { plan: '30d', price: 300, label: '30 Days', perMonth: '€3.00', popular: false },
  { plan: '90d', price: 800, label: '90 Days', perMonth: '€2.67', savings: 'Save 11%', popular: true },
  { plan: '365d', price: 3000, label: '365 Days', perMonth: '€2.50', savings: 'Best value', popular: false },
]

const selectedPlan = ref<string>('90d')
const selectedLicenseId = ref<number | null>(null)
const checkoutLoading = ref<'stripe' | 'paypal' | null>(null)
const checkoutError = ref<string | null>(null)

const paymentStatus = computed(() => {
  const p = route.query.payment
  if (p === 'success') return 'success'
  if (p === 'cancelled') return 'cancelled'
  return null
})

// Pre-select license from query param
watchEffect(() => {
  const licenseParam = route.query.license
  if (licenseParam && licenses.value) {
    const id = Number(licenseParam)
    const found = licenses.value.find(l => l.id === id)
    if (found) {
      selectedLicenseId.value = found.id
      return
    }
  }
  // Default to first license
  if (licenses.value && licenses.value.length > 0 && !selectedLicenseId.value) {
    selectedLicenseId.value = licenses.value[0].id
  }
})

const canCheckout = computed(() => selectedLicenseId.value !== null && selectedPlan.value !== null)

async function checkout(provider: 'stripe' | 'paypal') {
  if (!canCheckout.value) return
  checkoutLoading.value = provider
  checkoutError.value = null
  try {
    const result = await $fetch<{ url: string }>('/api/purchases/create', {
      method: 'POST',
      body: {
        licenseId: selectedLicenseId.value,
        plan: selectedPlan.value,
        provider,
      },
    })
    if (result.url) {
      window.location.href = result.url
    }
  }
  catch {
    checkoutError.value = 'Failed to start checkout. Please try again.'
  }
  finally {
    checkoutLoading.value = null
  }
}

useSeoMeta({
  title: 'Buy More Time — CS2Inspect',
})
</script>
