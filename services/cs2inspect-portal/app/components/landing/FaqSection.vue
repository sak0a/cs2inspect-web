<template>
  <section id="faq" class="py-24 bg-gray-950">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-16">
        <h2 class="text-4xl font-bold text-white mb-4">Frequently Asked Questions</h2>
        <p class="text-lg text-gray-400">Everything you need to know before getting started.</p>
      </div>

      <div class="space-y-3">
        <div
          v-for="(item, index) in faqs"
          :key="index"
          class="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden"
        >
          <button
            class="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-800/50 transition-colors"
            @click="toggle(index)"
          >
            <span class="font-medium text-white pr-4">{{ item.question }}</span>
            <svg
              :class="['w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200', openIndex === index ? 'rotate-180' : '']"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div
            v-show="openIndex === index"
            class="px-6 pb-5 text-sm text-gray-400 leading-relaxed border-t border-gray-800 pt-4"
          >
            {{ item.answer }}
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const openIndex = ref<number | null>(0)

function toggle(index: number) {
  openIndex.value = openIndex.value === index ? null : index
}

const faqs = [
  {
    question: 'What happens when my license expires?',
    answer: 'The plugin will stop working on your server. Your data and settings are preserved. Simply buy more time to reactivate — no setup required.',
  },
  {
    question: 'Can I change my server?',
    answer: 'Yes, you can rebind your license to a new server from the dashboard. This is allowed once every 7 days to prevent abuse.',
  },
  {
    question: 'Is there a free trial?',
    answer: 'Yes! Every new account automatically gets a 3-day trial period so you can test the plugin on your server before committing.',
  },
  {
    question: 'Do I need the web app too?',
    answer: 'The web app (cs2inspect-web) is free and open source — you can self-host it completely separately. The license here is only for the in-game server plugin.',
  },
  {
    question: 'Can I get a refund?',
    answer: 'Contact us within 7 days of your purchase for a full refund, no questions asked.',
  },
]
</script>
