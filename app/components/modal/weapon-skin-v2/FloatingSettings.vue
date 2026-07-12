<script setup lang="ts">
import type { WeaponConfiguration } from '~/types'

interface Props {
  customization: WeaponConfiguration
  selectedSkinName: string
  availableTeams?: string
  minFloat: number
  maxFloat: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:customization': [value: WeaponConfiguration]
  'duplicate': []
}>()

const { t } = useI18n()

const c = computed({
  get: () => props.customization,
  set: (val) => emit('update:customization', val),
})

const digitOnlyInputProps = { inputmode: 'numeric' as const, pattern: '[0-9]*' }
</script>

<template>
  <div
    class="absolute top-3 right-3 z-30"
    style="width: 220px; padding: 16px; background: rgba(18,18,18,0.92); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.07); border-radius: 8px; box-shadow: 0 6px 24px rgba(0,0,0,0.5);"
    @click.stop
  >
    <!-- StatTrak -->
    <div class="flex items-center justify-between mb-3">
      <span class="text-sm text-gray-400">{{ t('modals.weaponSkin.labels.stattrak') }}</span>
      <NSwitch v-model:value="c.stattrak_enabled" size="small" />
    </div>
    <NInputNumber
      v-if="c.stattrak_enabled"
      v-model:value="c.stattrak_count"
      :min="0" :max="99999" size="small"
      class="w-full mb-3"
      :input-props="digitOnlyInputProps"
    />

    <!-- Wear Slider -->
    <WearSlider
      v-model="c.paintwear"
      :max="maxFloat"
      :min="minFloat"
    />

    <!-- Paint Index -->
    <div class="flex items-center justify-between mt-3 mb-2">
      <span class="text-sm text-gray-400">{{ t('modals.weaponSkin.labels.paintIndex') }}</span>
      <NSwitch v-model:value="c.paintIndexOverride" size="small" />
    </div>
    <NInputNumber
      v-model:value="c.paintindex"
      :min="0" :max="9999" size="small"
      :disabled="!c.paintIndexOverride"
      :input-props="digitOnlyInputProps"
      class="w-full mb-3"
    />

    <!-- Seed -->
    <div class="flex items-center justify-between mb-2">
      <span class="text-sm text-gray-400">{{ t('modals.weaponSkin.labels.pattern') }}</span>
    </div>
    <NInputNumber
      v-model:value="c.paintseed"
      :min="0" :max="1000" size="small"
      :input-props="digitOnlyInputProps"
      class="w-full mb-3"
    />

    <!-- Name Tag -->
    <NInput
      v-model:value="c.nametag"
      :placeholder="t('modals.weaponSkin.inputs.nameTagPlaceholder') as string"
      size="small" maxlength="20" show-count
      class="mb-3"
    />

    <!-- Active -->
    <div class="flex items-center justify-between mb-3 w-full">
      <NSwitch v-model:value="c.active" size="small" class="w-full">
        <template #checked>{{ t('modals.weaponSkin.labels.itemActive') }}</template>
        <template #unchecked>{{ t('modals.weaponSkin.labels.itemInactive') }}</template>
      </NSwitch>
    </div>

    <!-- Duplicate -->
    <button
      v-if="availableTeams === 'both'"
      class="w-full text-center text-sm py-2 px-3 rounded bg-[#1a1a1a] border border-[#2a2a2a] text-gray-400 hover:text-gray-200 hover:border-[#444] transition-colors"
      @click="emit('duplicate')"
    >
      {{ t('modals.weaponSkin.buttons.duplicate') }} →
    </button>
  </div>
</template>
