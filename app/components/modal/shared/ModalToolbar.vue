<script setup lang="ts">
/**
 * ModalToolbar — shared header-extra toolbar for the item-selection modals
 * (Weapon/Knife/Glove skin modals + Sticker/Keychain/WrappedSticker pickers).
 *
 * Onyx recipe: destructive-ghost Reset, ghost History/Import/Generate with
 * lucide icons (replacing the hand-inlined Tabler SVG blocks), and a single
 * w-64 mono search input with an inline Search icon.
 *
 * Pure presentational: all labels arrive as props (each modal keeps its own
 * i18n keys, e.g. `modals.weaponSkin.buttons.reset` vs
 * `modals.knifeSkin.buttons.reset`), all clicks are emitted upward, and the
 * search query is a `v-model:search` binding — no modal state lives here.
 *
 * Button order is unified to: Reset | History | Import | Generate | slot | Search.
 *
 * Slots:
 * - `actions` — extra action buttons, rendered between the built-in buttons
 *   and the search input.
 */
import { Search, RefreshCw, History, ScanSearch, Link2 } from '@lucide/vue'

interface Props {
  /** Placeholder for the search input (pass the modal's existing i18n string). */
  searchPlaceholder?: string
  /** Hide the search input entirely (default: shown). */
  showSearch?: boolean

  /** Show the destructive-ghost Reset button. */
  showReset?: boolean
  /** Show the ghost History button. */
  showHistory?: boolean
  /** Show the ghost Import (from inspect link) button. */
  showImport?: boolean
  /** Show the ghost Generate (inspect link) button. */
  showGenerate?: boolean

  /** Visible label for the Reset button (i18n string from the parent). */
  resetLabel?: string
  /** Visible label for the History button (i18n string from the parent). */
  historyLabel?: string
  /** Visible label for the Import button (i18n string from the parent). */
  importLabel?: string
  /** Visible label for the Generate button (i18n string from the parent). */
  generateLabel?: string

  /** Disable the Reset button. */
  resetDisabled?: boolean
  /** Disable the History button. */
  historyDisabled?: boolean
  /** Disable the Import button. */
  importDisabled?: boolean
  /** Disable the Generate button. */
  generateDisabled?: boolean

  /** Show the Reset button in its loading state. */
  resetLoading?: boolean
  /** Show the Import button in its loading state. */
  importLoading?: boolean
  /** Show the Generate button in its loading state. */
  generateLoading?: boolean

  /** Optional `data-tutorial` id for the Reset button (e.g. "reset-button"). */
  resetTutorialId?: string
  /** Optional `data-tutorial` id for the History button (e.g. "history-button"). */
  historyTutorialId?: string
  /** Optional `data-tutorial` id for the Import button (e.g. "import-button"). */
  importTutorialId?: string
  /** Optional `data-tutorial` id for the Generate button (e.g. "save-button"). */
  generateTutorialId?: string
  /** Optional `data-tutorial` id for the search wrapper (e.g. "skin-search"). */
  searchTutorialId?: string
}

withDefaults(defineProps<Props>(), {
  searchPlaceholder: '',
  showSearch: true,
  showReset: false,
  showHistory: false,
  showImport: false,
  showGenerate: false,
  resetLabel: '',
  historyLabel: '',
  importLabel: '',
  generateLabel: '',
  resetDisabled: false,
  historyDisabled: false,
  importDisabled: false,
  generateDisabled: false,
  resetLoading: false,
  importLoading: false,
  generateLoading: false,
  resetTutorialId: undefined,
  historyTutorialId: undefined,
  importTutorialId: undefined,
  generateTutorialId: undefined,
  searchTutorialId: undefined,
})

/**
 * Search query, bound with `v-model:search` on the parent
 * (emits `update:search`).
 */
const search = defineModel<string>('search', { default: '' })

const emit = defineEmits<{
  /** Reset button clicked. */
  reset: []
  /** History button clicked. */
  history: []
  /** Import (from inspect link) button clicked. */
  import: []
  /** Generate (inspect link) button clicked. */
  generate: []
}>()
</script>

<template>
  <div class="flex shrink-0 items-center gap-1">
    <!-- Reset (destructive ghost) -->
    <Button
      v-if="showReset"
      variant="ghost"
      :loading="resetLoading"
      :disabled="resetDisabled"
      :icon-left="RefreshCw"
      :aria-label="resetLabel"
      :data-tutorial="resetTutorialId || undefined"
      class="text-destructive hover:bg-destructive/10 hover:text-[#ff7a7a] focus-visible:ring-destructive/30"
      @click="emit('reset')"
    >
      {{ resetLabel }}
    </Button>

    <Separator
      v-if="showReset && (showHistory || showImport || showGenerate)"
      orientation="vertical"
      class="mx-1.5 bg-border-strong data-[orientation=vertical]:h-4"
    />

    <!-- History (ghost) -->
    <Button
      v-if="showHistory"
      variant="ghost"
      :disabled="historyDisabled"
      :icon-left="History"
      :aria-label="historyLabel"
      :data-tutorial="historyTutorialId || undefined"
      class="text-muted-foreground hover:text-foreground"
      @click="emit('history')"
    >
      {{ historyLabel }}
    </Button>

    <!-- Import from inspect link (ghost) -->
    <Button
      v-if="showImport"
      variant="ghost"
      :loading="importLoading"
      :disabled="importDisabled"
      :icon-left="ScanSearch"
      :aria-label="importLabel"
      :data-tutorial="importTutorialId || undefined"
      class="text-muted-foreground hover:text-foreground"
      @click="emit('import')"
    >
      {{ importLabel }}
    </Button>

    <!-- Generate inspect link (ghost) -->
    <Button
      v-if="showGenerate"
      variant="ghost"
      :loading="generateLoading"
      :disabled="generateDisabled"
      :icon-left="Link2"
      :aria-label="generateLabel"
      :data-tutorial="generateTutorialId || undefined"
      class="text-muted-foreground hover:text-foreground"
      @click="emit('generate')"
    >
      {{ generateLabel }}
    </Button>

    <!-- Extra actions injected by the parent modal -->
    <slot name="actions" />

    <Separator
      v-if="
        showSearch && (showReset || showHistory || showImport || showGenerate || $slots.actions)
      "
      orientation="vertical"
      class="mx-1.5 bg-border-strong data-[orientation=vertical]:h-4"
    />

    <!-- Search -->
    <div
      v-if="showSearch"
      class="relative w-64 max-w-64"
      :data-tutorial="searchTutorialId || undefined"
    >
      <Search
        class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-tertiary"
      />
      <Input
        v-model="search"
        :placeholder="searchPlaceholder"
        class="w-full pl-9 font-mono text-[13px] placeholder:text-xs placeholder:tracking-[0.02em] placeholder:text-text-tertiary"
      />
    </div>
  </div>
</template>
