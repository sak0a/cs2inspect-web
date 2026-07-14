<script setup lang="ts">
import { steamAuth, type SteamUser } from '~/services/steamAuth'

const user = ref<SteamUser | null>(null)
const message = useToast()
const { t } = useI18n()

// Computed translations to avoid type issues in template
const trans = {
  title: computed(() => t('inspectLink.title') as string),
  description: computed(() => t('inspectLink.description') as string),
  inspectUrlLabel: computed(() => t('inspectLink.inspectUrlLabel') as string),
  placeholder: computed(() => t('inspectLink.placeholder') as string),
  importButton: computed(() => t('inspectLink.importButton') as string),
  decodedJsonLabel: computed(() => t('inspectLink.decodedJsonLabel') as string),
  copy: computed(() => t('common.copy') as string),
  generateButton: computed(() => t('inspectLink.generateButton') as string),
  featureDecodingTitle: computed(() => t('inspectLink.features.decodingTitle') as string),
  featureDecodingDesc: computed(() => t('inspectLink.features.decodingDescription') as string),
  featureEncodingTitle: computed(() => t('inspectLink.features.encodingTitle') as string),
  featureEncodingDesc: computed(() => t('inspectLink.features.encodingDescription') as string),
  featureMetadataTitle: computed(() => t('inspectLink.features.metadataTitle') as string),
  featureMetadataDesc: computed(() => t('inspectLink.features.metadataDescription') as string),
  apiStatus: computed(() => t('inspectLink.apiStatus') as string),
}

const inspectUrl = ref('')
const decodedJson = ref('')
const isLoading = ref(false)
const isGenerating = ref(false)

/**
 * Decodes an inspect link by calling the API
 * This will show the raw item data in the JSON editor
 */
const handleDecode = async () => {
  if (!inspectUrl.value) {
    message.warning(t('modals.inspectUrl.noInspectUrl') as string)
    return
  }

  isLoading.value = true
  try {
    const data = await $fetch<{
      item: Record<string, unknown>
      message?: string
      success?: boolean
    }>(`/api/inspect?action=inspect-item&steamId=${user.value?.steamId || ''}`, {
      method: 'POST',
      body: {
        inspectUrl: inspectUrl.value,
        itemType: 'weapon',
      },
    })

    // Display the item data in the text area
    decodedJson.value = JSON.stringify(data.item, null, 2)
    message.success(t('inspectLink.decodeSuccess') as string)
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    message.error(errorMessage || (t('modals.inspectUrl.defaultError') as string))
  } finally {
    isLoading.value = false
  }
}

/**
 * Generates an inspect link from the JSON data in the text area
 */
const handleGenerate = async () => {
  if (!decodedJson.value) return

  try {
    const parsedData = JSON.parse(decodedJson.value)
    isGenerating.value = true

    const data = await $fetch<{ inspectUrl: string; message?: string }>(
      `/api/inspect?action=create-url&steamId=${user.value?.steamId || ''}`,
      {
        method: 'POST',
        body: {
          ...parsedData,
          // Ensure common fields are present if they were named differently in the input JSON
          defindex: parsedData.defindex,
          paintindex: parsedData.paintindex,
          paintseed: parsedData.paintseed,
          paintwear: parsedData.paintwear,
          stattrak_enabled:
            parsedData.killeaterscoretype !== undefined
              ? !!parsedData.killeaterscoretype
              : parsedData.stattrak_enabled || parsedData.statTrak,
          stattrak_count:
            parsedData.killeatervalue || parsedData.stattrak_count || parsedData.statTrakCount,
          nametag: parsedData.customname || parsedData.nametag || parsedData.nameTag,
          stickers: parsedData.stickers,
          keychain: (parsedData.keychains && parsedData.keychains[0]) || parsedData.keychain,
          itemType: parsedData.itemType || 'weapon',
        },
      }
    )

    // Copy to clipboard
    await navigator.clipboard.writeText(data.inspectUrl)
    message.success(t('inspectLink.copySuccess') as string)
  } catch (err: unknown) {
    if (err instanceof SyntaxError) {
      message.error(t('inspectLink.invalidJson') as string)
    } else {
      const errorMessage = err instanceof Error ? err.message : String(err)
      message.error(errorMessage || (t('inspectLink.generateFailed') as string))
    }
  } finally {
    isGenerating.value = false
  }
}

const handleCopyJson = () => {
  if (!decodedJson.value) return
  navigator.clipboard.writeText(decodedJson.value)
  message.success(t('general.copiedToClipboard') as string)
}

onMounted(() => {
  user.value = steamAuth.getSavedUser()
})
</script>

<template>
  <div class="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-4xl mx-auto">
      <!-- Header Section -->
      <div class="text-center mb-12">
        <h1
          class="text-4xl font-extrabold text-white tracking-tight mb-4 flex items-center justify-center gap-3"
        >
          <span
            class="p-3 bg-blue-600/20 rounded-2xl text-blue-500 shadow-xl shadow-blue-500/10 border border-blue-500/20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M12 9a3 3 0 0 0-3 3a3 3 0 0 0 3 3a3 3 0 0 0 3-3a3 3 0 0 0-3-3m0 8a5 5 0 0 1-5-5a5 5 0 0 1 5-5a5 5 0 0 1 5 5a5 5 0 0 1-5 5m0-12.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5"
              />
            </svg>
          </span>
          {{ trans.title.value }}
        </h1>
        <p class="text-lg text-gray-400 max-w-2xl mx-auto">
          {{ trans.description.value }}
        </p>
      </div>

      <!-- Main Card -->
      <div class="rounded-3xl overflow-hidden border border-white/5 shadow-2xl relative group">
        <!-- Subtle gradient background -->

        <div class="p-8 sm:p-10 relative">
          <div class="space-y-8">
            <!-- Input Link Group -->
            <div class="space-y-3">
              <label
                class="text-sm font-semibold text-gray-400 uppercase tracking-wider ml-1 flex items-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                {{ trans.inspectUrlLabel.value }}
              </label>
              <div class="flex flex-col sm:flex-row gap-4">
                <div class="flex-1 relative group">
                  <Input
                    v-model="inspectUrl"
                    type="text"
                    :placeholder="trans.placeholder.value"
                    class="h-12 rounded-xl bg-black/20 dark:bg-black/20 border-white/5 px-4 text-base transition-all placeholder:text-white/20 hover:bg-black/30 hover:border-blue-500/30 focus-visible:bg-black/40 focus-visible:border-blue-500 focus-visible:ring-0 focus-visible:shadow-[0_0_0_4px_rgba(59,130,246,0.1)]"
                    data-tutorial="inspect-input"
                  />
                  <div
                    class="absolute inset-0 rounded-xl border border-blue-500/0 group-focus-within:border-blue-500/50 transition-all pointer-events-none"
                  />
                </div>
                <Button
                  variant="default"
                  size="lg"
                  :loading="isLoading"
                  data-tutorial="decode-button"
                  @click="handleDecode"
                >
                  <template #icon-left>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <polyline points="16 16 12 12 8 16" />
                      <line x1="12" y1="12" x2="12" y2="21" />
                      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                      <polyline points="16 16 12 12 8 16" />
                    </svg>
                  </template>
                  {{ trans.importButton.value }}
                </Button>
              </div>
            </div>

            <!-- JSON Editor Group -->
            <div class="space-y-3">
              <div class="flex justify-between items-center ml-1">
                <label
                  class="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                  </svg>
                  {{ trans.decodedJsonLabel.value }}
                </label>
                <div class="flex gap-2">
                  <Button variant="ghost" size="xs" @click="handleCopyJson">
                    <template #icon-left>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    </template>
                    {{ trans.copy.value }}
                  </Button>
                </div>
              </div>
              <div
                class="relative group rounded-2xl overflow-hidden inset-shadow-sm bg-black/20 border border-white/5"
                data-tutorial="inspect-editor"
              >
                <Textarea
                  v-model="decodedJson"
                  placeholder='{ "defindex": 7, "paintindex": 0, ... }'
                  class="json-editor w-full min-h-[318px] max-h-[586px] overflow-y-auto resize-none border-0 rounded-xl bg-transparent dark:bg-transparent p-6 font-mono text-[#e2e8f0] leading-[1.6] shadow-none focus-visible:ring-0 focus-visible:border-0 placeholder:text-white/20"
                />
                <div
                  class="absolute bottom-4 right-4 pointer-events-none opacity-20 text-xs font-mono text-gray-500"
                >
                  JSON-SCHEMA-V1
                </div>
              </div>
            </div>

            <!-- Footer Actions -->
            <div class="flex items-center justify-between pt-4 border-t border-white/5">
              <div class="text-xs text-gray-500 font-medium flex items-center gap-2">
                <div class="w-2 h-2 rounded-full bg-green-500/50 animate-pulse" />
                {{ trans.apiStatus.value }}
              </div>
              <Button
                variant="default"
                size="lg"
                :loading="isGenerating"
                :disabled="!decodedJson"
                data-tutorial="generate-button"
                @click="handleGenerate"
              >
                <template #icon-left>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                </template>
                {{ trans.generateButton.value }}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <!-- Feature highlight -->
      <div class="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div
          class="p-6 bg-[var(--card-bg)] rounded-2xl border border-white/5 flex flex-col items-center text-center gap-3"
        >
          <div class="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
              />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
          <h3 class="text-white font-bold">{{ trans.featureDecodingTitle.value }}</h3>
          <p class="text-xs text-gray-500">
            {{ trans.featureDecodingDesc.value }}
          </p>
        </div>
        <div
          class="p-6 bg-[var(--card-bg)] rounded-2xl border border-white/5 flex flex-col items-center text-center gap-3"
        >
          <div class="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h3 class="text-white font-bold">{{ trans.featureEncodingTitle.value }}</h3>
          <p class="text-xs text-gray-500">
            {{ trans.featureEncodingDesc.value }}
          </p>
        </div>
        <div
          class="p-6 bg-[var(--card-bg)] rounded-2xl border border-white/5 flex flex-col items-center text-center gap-3"
        >
          <div class="p-3 bg-amber-500/10 rounded-xl text-amber-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path
                d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
              />
            </svg>
          </div>
          <h3 class="text-white font-bold">{{ trans.featureMetadataTitle.value }}</h3>
          <p class="text-xs text-gray-500">
            {{ trans.featureMetadataDesc.value }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.json-editor {
  font-family: 'JetBrains Mono', 'Fira Code', 'Roboto Mono', monospace;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
}
</style>
