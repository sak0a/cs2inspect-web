<script setup lang="ts">
import {
  Braces,
  CloudDownload,
  Copy,
  Eye,
  Link2,
  Package,
  Save,
  Settings2,
  ShieldCheck,
} from '@lucide/vue'
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
          class="font-display text-4xl font-bold text-foreground tracking-tight mb-4 flex items-center justify-center gap-4"
        >
          <span
            class="relative flex size-14 shrink-0 items-center justify-center rounded-[var(--radius-card)] border border-border bg-card text-primary"
          >
            <span
              class="pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(60%_60%_at_50%_45%,rgba(250,204,21,0.16),transparent_72%)]"
              aria-hidden="true"
            />
            <Eye class="relative size-7" />
          </span>
          {{ trans.title.value }}
        </h1>
        <p class="text-lg text-muted-foreground max-w-2xl mx-auto">
          {{ trans.description.value }}
        </p>
      </div>

      <!-- Main Card -->
      <div
        class="bg-card rounded-[var(--radius-modal)] border border-border shadow-[var(--shadow-card)] overflow-hidden"
      >
        <div class="p-8 sm:p-10">
          <div class="space-y-8">
            <!-- Input Link Group -->
            <div class="space-y-3">
              <label
                class="font-mono text-[10px] uppercase tracking-[0.12em] text-text-tertiary ml-1 flex items-center gap-2"
              >
                <Link2 class="size-3.5" />
                {{ trans.inspectUrlLabel.value }}
              </label>
              <div class="flex flex-col sm:flex-row gap-4">
                <Input
                  v-model="inspectUrl"
                  type="text"
                  :placeholder="trans.placeholder.value"
                  class="h-11 flex-1"
                  data-tutorial="inspect-input"
                />
                <Button
                  variant="default"
                  size="lg"
                  :loading="isLoading"
                  data-tutorial="decode-button"
                  @click="handleDecode"
                >
                  <template #icon-left>
                    <CloudDownload class="size-5" />
                  </template>
                  {{ trans.importButton.value }}
                </Button>
              </div>
            </div>

            <!-- JSON Editor Group -->
            <div class="space-y-3">
              <div class="flex justify-between items-center ml-1">
                <label
                  class="font-mono text-[10px] uppercase tracking-[0.12em] text-text-tertiary flex items-center gap-2"
                >
                  <Braces class="size-3.5" />
                  {{ trans.decodedJsonLabel.value }}
                </label>
                <div class="flex gap-2">
                  <Button variant="ghost" size="xs" @click="handleCopyJson">
                    <template #icon-left>
                      <Copy class="size-3.5" />
                    </template>
                    {{ trans.copy.value }}
                  </Button>
                </div>
              </div>
              <div class="relative" data-tutorial="inspect-editor">
                <Textarea
                  v-model="decodedJson"
                  placeholder='{ "defindex": 7, "paintindex": 0, ... }'
                  class="w-full min-h-[318px] max-h-[586px] overflow-y-auto resize-none rounded-[var(--radius-card)] p-5 font-mono text-[13px] leading-[1.6]"
                />
                <div
                  class="absolute bottom-4 right-4 pointer-events-none font-mono text-[10px] uppercase tracking-[0.12em] text-text-tertiary/60"
                >
                  JSON-SCHEMA-V1
                </div>
              </div>
            </div>

            <!-- Footer Actions -->
            <div class="flex items-center justify-between pt-4 border-t border-border">
              <div
                class="font-mono text-[10px] uppercase tracking-[0.12em] text-text-tertiary flex items-center gap-2"
              >
                <div class="size-2 rounded-full bg-emerald-500 animate-pulse" />
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
                  <Save class="size-5" />
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
          class="p-6 bg-card rounded-[var(--radius-card)] border border-border flex flex-col items-center text-center gap-3"
        >
          <div
            class="flex size-11 items-center justify-center rounded-[var(--radius-ctl)] border border-border bg-surface-2 text-primary"
          >
            <Package class="size-5" />
          </div>
          <h3 class="font-display font-semibold tracking-tight text-foreground">
            {{ trans.featureDecodingTitle.value }}
          </h3>
          <p class="text-xs text-muted-foreground">
            {{ trans.featureDecodingDesc.value }}
          </p>
        </div>
        <div
          class="p-6 bg-card rounded-[var(--radius-card)] border border-border flex flex-col items-center text-center gap-3"
        >
          <div
            class="flex size-11 items-center justify-center rounded-[var(--radius-ctl)] border border-border bg-surface-2 text-primary"
          >
            <ShieldCheck class="size-5" />
          </div>
          <h3 class="font-display font-semibold tracking-tight text-foreground">
            {{ trans.featureEncodingTitle.value }}
          </h3>
          <p class="text-xs text-muted-foreground">
            {{ trans.featureEncodingDesc.value }}
          </p>
        </div>
        <div
          class="p-6 bg-card rounded-[var(--radius-card)] border border-border flex flex-col items-center text-center gap-3"
        >
          <div
            class="flex size-11 items-center justify-center rounded-[var(--radius-ctl)] border border-border bg-surface-2 text-primary"
          >
            <Settings2 class="size-5" />
          </div>
          <h3 class="font-display font-semibold tracking-tight text-foreground">
            {{ trans.featureMetadataTitle.value }}
          </h3>
          <p class="text-xs text-muted-foreground">
            {{ trans.featureMetadataDesc.value }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
