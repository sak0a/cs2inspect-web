<script setup lang="ts">
const props = defineProps<{ show: boolean }>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
}>()

const { t } = useI18n()
const tutorialStore = useTutorialStore()
const { startTutorial } = useTutorials()

const showModal = computed({
  get: () => props.show,
  set: (value: boolean) => emit('update:show', value)
})

const runningTutorialId = computed(() => tutorialStore.activeTutorialId)

function handleStart(id: string) {
  const started = startTutorial(id)
  if (started) {
    showModal.value = false
  }
}

function handleResume(id: string) {
  const resumed = tutorialStore.resumeTutorial(id)
  if (resumed) {
    showModal.value = false
  }
}
</script>

<template>
  <NModal v-model:show="showModal" preset="card" :title="t('tutorials.launcher.title')" class="tutorial-launcher-modal" style="max-width: 720px;">
    <div class="flex flex-col gap-3">
      <div
        v-for="tutorial in tutorialStore.tutorials"
        :key="tutorial.id"
        class="tutorial-card"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="font-semibold text-base">{{ t(tutorial.titleKey) }}</h3>
            <p class="text-sm text-gray-300">{{ t(tutorial.descriptionKey) }}</p>
            <p class="text-xs text-gray-400 mt-1">
              {{ t('tutorials.launcher.estimatedTime', { minutes: tutorial.estimatedMinutes }) }} · {{ t(`tutorials.difficulty.${tutorial.difficulty}`) }}
            </p>
          </div>
          <NTag size="small" :bordered="false" type="success" v-if="tutorialStore.progressByTutorial[tutorial.id]?.completed">
            {{ t('tutorials.launcher.completed') }}
          </NTag>
        </div>

        <div class="mt-3 flex gap-2">
          <NButton size="small" type="primary" :disabled="!!runningTutorialId && runningTutorialId !== tutorial.id" @click="handleStart(tutorial.id)">
            {{ t('tutorials.launcher.start') }}
          </NButton>
          <NButton
            v-if="tutorialStore.progressByTutorial[tutorial.id]"
            size="small"
            secondary
            :disabled="!!runningTutorialId && runningTutorialId !== tutorial.id"
            @click="handleResume(tutorial.id)"
          >
            {{ t('tutorials.launcher.resume') }}
          </NButton>
        </div>
      </div>

      <div class="flex justify-end mt-2" v-if="tutorialStore.isRunning">
        <NButton tertiary type="error" @click="tutorialStore.stopTutorial()">
          {{ t('tutorials.launcher.stopCurrent') }}
        </NButton>
      </div>
    </div>
  </NModal>
</template>

<style scoped lang="sass">
.tutorial-card
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08))
  background: rgba(20, 20, 20, 0.55)
  backdrop-filter: blur(10px)
  border-radius: 12px
  padding: 12px
</style>
