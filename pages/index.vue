<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useMessage } from 'naive-ui'
import { steamAuth, type SteamUser } from '~/services/steamAuth'
import { useInspectItem } from '~/composables/useInspectItem'
import { WeaponCustomization, KnifeCustomization, GloveCustomization } from '~/server/utils/interfaces'

const user = ref<SteamUser | null>(null)
const showImportModal = ref(false)
const showWeaponModal = ref(false)
const showKnifeModal = ref(false)
const showGloveModal = ref(false)
const isGeneratingLink = ref(false)
const message = useMessage()
const { t } = useI18n()

// Use the inspect item composable
const {
  inspectedItem,
  itemType,
  customization,
  isLoading,
  error,
  analyzeInspectLink,
  loadFromStorage,
  clearItem,
  updateCustomization,
  updateItem,
  generateInspectLink,
  hasItem
} = useInspectItem()

// Create a new item from scratch
const createNewItem = async (type: 'weapon' | 'knife' | 'glove') => {
  if (!user.value?.steamId) {
    message.error(t('auth.loginRequired'))
    return
  }

  try {
    // Clear any existing item
    clearItem()

    // Create a new item based on type
    if (type === 'weapon') {
      // Default to AK-47
      const defaultWeapon = {
        weapon_defindex: 7,
        defaultName: 'AK-47',
        paintIndex: 0,
        defaultImage: '/images/weapons/ak47.png',
        weapon_name: 'weapon_ak47',
        category: 'rifle',
        availableTeams: 'both',
        name: 'AK-47',
        image: '/images/weapons/ak47.png',
        minFloat: 0,
        maxFloat: 1,
        rarity: { id: '0', name: 'Default', color: '#b0c3d9' },
        team: null
      }

      const defaultCustomization: WeaponCustomization = {
        active: true,
        statTrak: false,
        statTrakCount: 0,
        defindex: 7,
        paintIndex: 0,
        paintIndexOverride: false,
        pattern: 0,
        wear: 0,
        nameTag: '',
        stickers: [null, null, null, null, null],
        keychain: null,
        team: 0
      }

      updateItem(defaultWeapon)
      updateCustomization(defaultCustomization)
      itemType.value = 'weapon'
      showWeaponModal.value = true
    }
    else if (type === 'knife') {
      // Default to Karambit
      const defaultKnife = {
        weapon_defindex: 507,
        defaultName: 'Karambit',
        paintIndex: 0,
        defaultImage: '/images/knives/karambit.png',
        weapon_name: 'weapon_knife_karambit',
        category: 'knife',
        availableTeams: 'both',
        name: 'Karambit',
        image: '/images/knives/karambit.png',
        minFloat: 0,
        maxFloat: 1,
        rarity: { id: '0', name: 'Default', color: '#b0c3d9' },
        team: null
      }

      const defaultCustomization: KnifeCustomization = {
        active: true,
        statTrak: false,
        statTrakCount: 0,
        defindex: 507,
        paintIndex: 0,
        paintIndexOverride: false,
        pattern: 0,
        wear: 0,
        nameTag: '',
        team: 0
      }

      updateItem(defaultKnife)
      updateCustomization(defaultCustomization)
      itemType.value = 'knife'
      showKnifeModal.value = true
    }
    else if (type === 'glove') {
      // Default to Sport Gloves
      const defaultGlove = {
        weapon_defindex: 5027,
        defaultName: 'Sport Gloves',
        paintIndex: 0,
        defaultImage: '/images/gloves/sport_gloves.png',
        weapon_name: 'weapon_glove_sporty',
        category: 'glove',
        availableTeams: 'both',
        name: 'Sport Gloves',
        image: '/images/gloves/sport_gloves.png',
        minFloat: 0,
        maxFloat: 1,
        rarity: { id: '0', name: 'Default', color: '#b0c3d9' },
        team: null
      }

      const defaultCustomization: GloveCustomization = {
        active: true,
        defindex: 5027,
        paintIndex: 0,
        paintIndexOverride: false,
        pattern: 0,
        wear: 0,
        team: 0
      }

      updateItem(defaultGlove)
      updateCustomization(defaultCustomization)
      itemType.value = 'glove'
      showGloveModal.value = true
    }

    message.success(t('inspectItem.itemCreated'))
  } catch (err: any) {
    console.error('Error creating item:', err)
    message.error(err.message || t('inspectItem.createFailed'))
  }
}

// Handle inspect link submission
const handleInspectLinkSubmit = async (inspectUrl: string) => {
  if (!user.value?.steamId) {
    message.error(t('auth.loginRequired'))
    return
  }

  try {
    await analyzeInspectLink(inspectUrl, user.value.steamId)
    showImportModal.value = false

    if (hasItem.value) {
      message.success(t('inspectItem.importSuccess'))
    }
  } catch (err: any) {
    message.error(err.message || t('inspectItem.importFailed'))
  }
}

// Open the appropriate modal based on item type
const handleCustomize = () => {
  if (!hasItem.value) return

  switch (itemType.value) {
    case 'weapon':
      showWeaponModal.value = true
      break
    case 'knife':
      showKnifeModal.value = true
      break
    case 'glove':
      showGloveModal.value = true
      break
  }
}

// Handle weapon skin save
const handleWeaponSkinSave = (weapon: any, newCustomization: WeaponCustomization) => {
  updateItem(weapon)
  updateCustomization(newCustomization)
  showWeaponModal.value = false
  message.success(t('inspectItem.customizationSaved'))
}

// Handle knife skin save
const handleKnifeSkinSave = (knife: any, newCustomization: KnifeCustomization) => {
  updateItem(knife)
  updateCustomization(newCustomization)
  showKnifeModal.value = false
  message.success(t('inspectItem.customizationSaved'))
}

// Handle glove skin save
const handleGloveSkinSave = (glove: any, newCustomization: GloveCustomization) => {
  updateItem(glove)
  updateCustomization(newCustomization)
  showGloveModal.value = false
  message.success(t('inspectItem.customizationSaved'))
}

// Generate inspect link for current item
const handleGenerateLink = async () => {
  if (!hasItem.value || !user.value?.steamId) return

  isGeneratingLink.value = true

  try {
    const link = await generateInspectLink(user.value.steamId)

    if (link) {
      await navigator.clipboard.writeText(link)
      message.success(t('inspectItem.linkCopied'), { duration: 3000 })
    } else {
      throw new Error(t('inspectItem.generateLinkFailed'))
    }
  } catch (err: any) {
    message.error(err.message || t('inspectItem.generateLinkFailed'))
  } finally {
    isGeneratingLink.value = false
  }
}

// Other team has skin (always false for this feature)
const otherTeamHasSkin = computed(() => false)

onMounted(() => {
  user.value = steamAuth.getSavedUser()
  loadFromStorage()
})
</script>

<template>
  <div class="p-4 bg-[#181818]">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-white mb-2">{{ t('inspectItem.title') }}</h1>
        <p class="text-gray-400">{{ t('inspectItem.description') }}</p>
      </div>

      <!-- Main Content -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Left Side: Item Display -->
        <div>
          <InspectItemDisplay
            :item="inspectedItem"
            :item-type="itemType"
            :customization="customization"
            :is-loading="isLoading"
            :user="user"
            @customize="handleCustomize"
            @clear="clearItem"
            @generate-link="handleGenerateLink"
          />
        </div>

        <!-- Right Side: Controls -->
        <div class="bg-[#242424] p-6 rounded-lg">
          <h2 class="text-xl font-bold text-white mb-4">{{ t('inspectItem.controlsSection') }}</h2>

          <!-- Create New Item Section -->
          <div class="mb-6">
            <h3 class="text-lg font-semibold text-white mb-3">{{ t('inspectItem.createNewItem') }}</h3>
            <p class="text-gray-300 mb-3">{{ t('inspectItem.createNewItemDesc') }}</p>

            <div class="grid grid-cols-3 gap-3 mb-4">
              <NButton
                type="info"
                @click="createNewItem('weapon')"
                :disabled="isLoading"
              >
                {{ t('common.weapon') }}
              </NButton>

              <NButton
                type="info"
                @click="createNewItem('knife')"
                :disabled="isLoading"
              >
                {{ t('common.knife') }}
              </NButton>

              <NButton
                type="info"
                @click="createNewItem('glove')"
                :disabled="isLoading"
              >
                {{ t('common.glove') }}
              </NButton>
            </div>
          </div>

          <!-- Import Section -->
          <div class="mb-6">
            <h3 class="text-lg font-semibold text-white mb-3">{{ t('inspectItem.importSection') }}</h3>
            <p class="text-gray-300 mb-3">{{ t('inspectItem.importDesc') }}</p>

            <NButton
              type="primary"
              size="large"
              block
              @click="showImportModal = true"
              :disabled="isLoading"
            >
              <template #icon>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
              </template>
              {{ t('inspectItem.importButton') }}
            </NButton>
          </div>

          <!-- Instructions -->
          <div class="mb-6">
            <h3 class="text-lg font-semibold text-white mb-3">{{ t('inspectItem.instructions') }}</h3>
            <ul class="list-disc list-inside text-gray-400 space-y-1">
              <li>{{ t('inspectItem.instructionStep1') }}</li>
              <li>{{ t('inspectItem.instructionStep2') }}</li>
              <li>{{ t('inspectItem.instructionStep3') }}</li>
            </ul>
          </div>

          <!-- Error Display -->
          <div v-if="error" class="mt-4 p-3 bg-red-900/30 border border-red-700 rounded text-red-300">
            {{ error }}
          </div>
        </div>
      </div>

      <!-- No User State -->
      <div v-if="!user" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div class="bg-[#242424] p-8 rounded-lg max-w-md text-center">
          <h2 class="text-xl font-bold text-white mb-4">{{ t('auth.loginRequired') }}</h2>
          <p class="text-gray-300 mb-6">{{ t('auth.loginToUseFeature') }}</p>
          <NButton type="primary" size="large" @click="steamAuth.login()">
            <template #icon>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2a10 10 0 0 0-10 10c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/>
              </svg>
            </template>
            {{ t('auth.loginButton') }}
          </NButton>
        </div>
      </div>
    </div>

    <!-- Import Modal -->
    <InspectURLModal
      v-model:visible="showImportModal"
      :loading="isLoading"
      @submit="handleInspectLinkSubmit"
    />

    <!-- Weapon Skin Modal -->
    <WeaponSkinModal
      v-if="itemType === 'weapon'"
      v-model:visible="showWeaponModal"
      :weapon="inspectedItem"
      :other-team-has-skin="otherTeamHasSkin"
      @save="handleWeaponSkinSave"
    />

    <!-- Knife Skin Modal -->
    <KnifeSkinModal
      v-if="itemType === 'knife'"
      v-model:visible="showKnifeModal"
      :weapon="inspectedItem"
      :user="user"
      :other-team-has-skin="otherTeamHasSkin"
      @save="handleKnifeSkinSave"
    />

    <!-- Glove Skin Modal -->
    <GloveSkinModal
      v-if="itemType === 'glove'"
      v-model:visible="showGloveModal"
      :weapon="inspectedItem"
      :user="user"
      :other-team-has-skin="otherTeamHasSkin"
      @select="handleGloveSkinSave"
    />
  </div>
</template>

<style scoped>
/* Add any page-specific styles here */
</style>