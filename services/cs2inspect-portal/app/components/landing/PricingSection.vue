<template>
  <section id="pricing" class="py-24 bg-gray-950">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-16">
        <h2 class="text-4xl font-bold text-white mb-4">Simple, Fair Pricing</h2>
        <p class="text-lg text-gray-400">One license per server. No hidden fees.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        <div
          v-for="plan in plans"
          :key="plan.name"
          :class="[
            'relative flex flex-col rounded-2xl p-8 border transition-all',
            plan.highlighted
              ? 'bg-blue-950/30 border-blue-500/50 shadow-xl shadow-blue-500/10 scale-105'
              : 'bg-gray-900 border-gray-800 hover:border-gray-700',
          ]"
        >
          <!-- Badge -->
          <div
            v-if="plan.badge"
            :class="[
              'absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap',
              plan.highlighted ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-200',
            ]"
          >
            {{ plan.badge }}
          </div>

          <div class="mb-6">
            <h3 class="text-lg font-semibold text-gray-300 mb-3">{{ plan.name }}</h3>
            <div class="flex items-baseline gap-1">
              <span class="text-4xl font-bold text-white">{{ plan.price }}</span>
            </div>
            <div class="text-sm text-gray-400 mt-1">{{ plan.perMonth }}/mo equivalent</div>
          </div>

          <ul class="flex-1 space-y-3 mb-8">
            <li v-for="feature in plan.features" :key="feature" class="flex items-center gap-2 text-sm text-gray-300">
              <svg class="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {{ feature }}
            </li>
          </ul>

          <a
            :href="steamLoginUrl"
            :class="[
              'block text-center py-3 px-6 rounded-xl font-semibold text-sm transition-all',
              plan.highlighted
                ? 'bg-blue-600 hover:bg-blue-500 text-white hover:shadow-lg hover:shadow-blue-500/25'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 hover:border-gray-600',
            ]"
          >
            Get Started
          </a>
        </div>
      </div>

      <!-- Multi-server note -->
      <p class="text-center text-gray-500 text-sm mt-8">
        Running multiple servers?
        <span class="text-gray-300 font-medium">Get 15% off each additional license.</span>
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
const config = useRuntimeConfig()

const steamLoginUrl = computed(() => {
  const returnTo = encodeURIComponent(`${config.public.portalBaseUrl}/api/auth/steam-validate`)
  return `https://steamcommunity.com/openid/login?openid.mode=checkid_setup&openid.ns=http://specs.openid.net/auth/2.0&openid.claimed_id=http://specs.openid.net/auth/2.0/identifier_select&openid.identity=http://specs.openid.net/auth/2.0/identifier_select&openid.return_to=${returnTo}`
})

const plans = [
  {
    name: '30 Days',
    price: '€3',
    perMonth: '€3.00',
    badge: null,
    highlighted: false,
    features: [
      'Full plugin access',
      'All cosmetic categories',
      'Real-time updates',
      'Dashboard access',
    ],
  },
  {
    name: '90 Days',
    price: '€8',
    perMonth: '€2.67',
    badge: 'Popular',
    highlighted: true,
    features: [
      'Full plugin access',
      'All cosmetic categories',
      'Real-time updates',
      'Dashboard access',
      'Priority support',
    ],
  },
  {
    name: '365 Days',
    price: '€30',
    perMonth: '€2.50',
    badge: 'Best Value',
    highlighted: false,
    features: [
      'Full plugin access',
      'All cosmetic categories',
      'Real-time updates',
      'Dashboard access',
      'Priority support',
      'Early access to features',
    ],
  },
]
</script>
