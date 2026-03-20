<template>
  <section id="features" class="py-24 bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-16">
        <h2 class="text-4xl font-bold text-white mb-4">Everything Your Players Want</h2>
        <p class="text-lg text-gray-400 max-w-2xl mx-auto">
          A complete weapon customization suite for your CS2 server, covering every cosmetic players care about.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="feature in features"
          :key="feature.title"
          class="group relative p-6 rounded-2xl bg-gray-950 border border-gray-800 hover:border-gray-600 transition-all hover:-translate-y-0.5"
        >
          <div class="text-4xl mb-4">{{ feature.icon }}</div>
          <h3 class="text-lg font-semibold text-white mb-2">{{ feature.title }}</h3>
          <p class="text-sm text-gray-400 leading-relaxed">{{ feature.description }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const features = [
  {
    icon: '🎨',
    title: 'Weapon Skins',
    description: 'Custom paint indices, patterns, and wear values for every weapon in the game. Full skin database included.',
  },
  {
    icon: '🔪',
    title: 'Knives & Gloves',
    description: 'Full knife and glove customization with all variants. Let players wield any knife or glove they want.',
  },
  {
    icon: '🏷️',
    title: 'Stickers',
    description: 'Apply stickers to weapons with precise positioning, rotation, and wear controls for a personal touch.',
  },
  {
    icon: '📊',
    title: 'StatTrak',
    description: 'StatTrak support for all compatible weapons. Players can track their kills in style.',
  },
  {
    icon: '🎵',
    title: 'Agents & Music',
    description: 'Agent model selection and music kit customization. Full operator and audio personalization.',
  },
  {
    icon: '⚡',
    title: 'Real-time Preview',
    description: 'Players see changes instantly in-game without needing to restart or reconnect.',
  },
]
</script>
