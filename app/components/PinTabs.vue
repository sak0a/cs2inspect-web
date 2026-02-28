<script setup lang="ts">
// Removed unused computed import
import type { APICollectible } from '~/server/types'

interface Props {
    collectible: APICollectible
    isSelected?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    isSelected: false,
})

const emit = defineEmits<{
    (e: 'select', collectible: APICollectible): void
}>()
const { t: _t } = useI18n()

const handleSelect = () => {
    emit('select', props.collectible)
}

// Removed unused computed properties: getCollectibleBaseId, isPin
</script>

<template>
    <NCard
        :style="{
            borderColor: collectible.rarity?.color || '#313030',
            background: collectible.rarity?.color
                ? 'linear-gradient(135deg, #101010, ' +
                  hexToRgba(collectible.rarity?.color, '0.15') +
                  ')'
                : '#242424',
        }"
        :class="[
            'cursor-pointer rounded-xl bg-[var(--card-bg)] pin-card',
            isSelected
                ? 'selected-pin ring-2 ring-[var(--selection-ring)] border-0 visible'
                : 'hover:shadow-lg hover:scale-100 hover:z-10',
        ]"
        @click="handleSelect"
    >
        <div class="flex flex-col items-center h-full">
            <img
                :src="collectible.image"
                :alt="collectible.name"
                class="w-full h-32 object-contain mb-2"
                loading="lazy"
            />
            <div class="w-full flex-grow flex flex-col">
                <div>
                    <p class="text-sm text-white line-clamp-2 h-10 pin-name">
                        {{ collectible.name }}
                        <span v-if="collectible.genuine" class="text-[#4D7455]">(Genuine)</span>
                    </p>
                    <p
                        v-if="collectible.description"
                        class="text-xs text-gray-400 line-clamp-4 h-16 pin-desc"
                    >
                        {{ collectible.description }}
                    </p>
                </div>
                <div
                    class="h-1 mt-auto"
                    :style="{ background: collectible.rarity?.color || '#313030' }"
                />
            </div>
        </div>
    </NCard>
</template>

<style scoped>
.n-card {
    background: #242424;
    border: 1px solid #313030;
    height: 300px;
    width: 100%; /* Full width to fit in grid cell */
    display: flex;
    flex-direction: column;
    transition:
        transform 0.3s ease,
        box-shadow 0.3s ease;
}

.pin-name {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
}

.pin-desc {
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 0;
}

/* Ring styling for selected pins */
.selected-pin {
    transform: scale(1.05) !important;
    z-index: 20 !important;
    transition: none !important; /* Make the change instant */
    animation: none !important; /* Disable any animations */
    opacity: 1 !important;
    visibility: visible !important;
}
</style>
