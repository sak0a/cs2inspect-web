<template>
  <div class="min-h-screen bg-gray-950">
    <AppNavbar />

    <main class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 space-y-10">
      <div>
        <h1 class="text-3xl font-bold text-white">Settings</h1>
        <p class="mt-1 text-gray-400 text-sm">Manage your account settings.</p>
      </div>

      <!-- Steam Account -->
      <section>
        <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Steam Account</h2>
        <div class="rounded-2xl bg-gray-900 border border-gray-800 p-6">
          <div class="flex items-center gap-4">
            <img
              v-if="auth.customer?.avatarurl"
              :src="auth.customer.avatarurl"
              :alt="auth.customer.personaname"
              class="w-14 h-14 rounded-full border border-gray-700"
            />
            <div v-else class="w-14 h-14 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center">
              <svg class="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <div class="text-base font-semibold text-white">{{ auth.customer?.personaname }}</div>
              <div class="text-sm text-gray-500 font-mono mt-0.5">{{ auth.customer?.steamid }}</div>
            </div>
          </div>
          <p class="mt-4 text-xs text-gray-600">Steam account details are read-only and updated automatically on login.</p>
        </div>
      </section>

      <!-- Email -->
      <section>
        <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Email Address</h2>
        <div class="rounded-2xl bg-gray-900 border border-gray-800 p-6">
          <p class="text-sm text-gray-400 mb-4">
            Used for purchase receipts and important notifications. We'll never share it.
          </p>
          <div class="flex gap-3">
            <input
              v-model="email"
              type="email"
              placeholder="you@example.com"
              class="flex-1 rounded-xl bg-gray-950 border border-gray-700 text-white text-sm px-4 py-2.5 focus:outline-none focus:border-blue-500 placeholder-gray-600 transition-colors"
            />
            <button
              :disabled="emailSaving || !email"
              class="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors whitespace-nowrap"
              @click="saveEmail"
            >
              {{ emailSaving ? 'Saving…' : 'Save' }}
            </button>
          </div>
          <p v-if="emailError" class="mt-2 text-red-400 text-sm">{{ emailError }}</p>
          <p v-if="emailSaved" class="mt-2 text-green-400 text-sm">Email saved successfully.</p>
        </div>
      </section>

      <!-- Purchase History -->
      <section>
        <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Purchase History</h2>
        <div class="rounded-2xl bg-gray-900 border border-gray-800 overflow-hidden">
          <div v-if="purchasesPending" class="p-6 text-center">
            <div class="animate-pulse text-gray-600 text-sm">Loading…</div>
          </div>

          <div v-else-if="!purchases || purchases.length === 0" class="p-6 text-center text-gray-600 text-sm">
            No purchases yet.
          </div>

          <table v-else class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-800">
                <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Plan</th>
                <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Provider</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="purchase in purchases"
                :key="purchase.id"
                class="border-b border-gray-800/50 last:border-0"
              >
                <td class="px-5 py-3.5 text-gray-300">{{ formatDate(purchase.created_at) }}</td>
                <td class="px-5 py-3.5 text-gray-300">{{ formatPlan(purchase.plan) }}</td>
                <td class="px-5 py-3.5 text-gray-300">€{{ (purchase.amountcents / 100).toFixed(2) }}</td>
                <td class="px-5 py-3.5">
                  <span
                    :class="[
                      'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                      purchase.provider === 'stripe' ? 'bg-blue-900/40 text-blue-400' : 'bg-yellow-900/40 text-yellow-400',
                    ]"
                  >
                    {{ purchase.provider === 'stripe' ? 'Stripe' : 'PayPal' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const auth = useAuthStore()
const { data: purchases, pending: purchasesPending } = await useFetch('/api/purchases')

const email = ref(auth.customer?.email ?? '')
const emailSaving = ref(false)
const emailSaved = ref(false)
const emailError = ref<string | null>(null)

function formatDate(date: Date | string | null): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatPlan(plan: string): string {
  const map: Record<string, string> = {
    '30d': '30 Days',
    '90d': '90 Days',
    '365d': '365 Days',
  }
  return map[plan] ?? plan
}

async function saveEmail() {
  emailSaving.value = true
  emailError.value = null
  emailSaved.value = false
  try {
    await $fetch('/api/settings/email', {
      method: 'PUT',
      body: { email: email.value },
    })
    emailSaved.value = true
    await auth.fetchUser()
    setTimeout(() => { emailSaved.value = false }, 3000)
  }
  catch {
    emailError.value = 'Failed to save email. Please check the address and try again.'
  }
  finally {
    emailSaving.value = false
  }
}

useSeoMeta({
  title: 'Settings — CS2Inspect',
})
</script>
