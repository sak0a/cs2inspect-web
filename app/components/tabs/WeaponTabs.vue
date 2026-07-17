<script setup lang="ts">
import type { DBWeapon, WeaponItemData } from '~/types'
import { toSteamId, toLoadoutId, toDefindex, toPaintIndex } from '~/types/core/common'
import {
  LucideEllipsisVertical,
  LucideLink,
  LucideEye,
  LucideEyeOff,
  LucideRotateCcw,
  LucideImport,
} from '@lucide/vue'
import { Button } from '@/components/ui/button'

interface Props {
  weaponData: {
    weapons: WeaponItemData[]
    defaultName: string
    availableTeams?: string
    [key: string]: unknown
  }
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'weaponClick', weapon: WeaponItemData): void
  (
    e: 'quick-action',
    payload: { action: 'generate' | 'import' | 'toggle' | 'reset'; weapon: WeaponItemData }
  ): void
  (e: 'error', error: string): void
}>()

const { teamNumber } = useTeamToggle()

// Filter weapons for the currently selected team
const filteredWeapons = computed(() =>
  props.weaponData.weapons.filter((w: WeaponItemData) => w.databaseInfo?.team === teamNumber.value)
)

// Check if there's any skin for the current team
const hasCurrentTeamSkin = computed(() => filteredWeapons.value.length > 0)

const isVanillaSkin = (weapon: WeaponItemData): boolean => {
  return (
    weapon.databaseInfo !== undefined &&
    (weapon.databaseInfo.paintindex === 0 || weapon.paintindex === 0)
  )
}

const getWeaponLabel = (weapon: WeaponItemData): string => {
  if (isVanillaSkin(weapon)) {
    return `${weapon.defaultName} | Vanilla`
  }
  return weapon.name
}

/** Split "Weapon | Skin" into ItemCard's name / muted subName pair. */
const getDisplayName = (weapon: WeaponItemData): { name: string; sub?: string } => {
  if (isVanillaSkin(weapon)) {
    return { name: weapon.defaultName, sub: 'Vanilla' }
  }
  const full = weapon.name || weapon.defaultName
  const idx = full.indexOf(' | ')
  if (idx === -1) return { name: full }
  return { name: full.slice(0, idx), sub: full.slice(idx + 3) }
}

/** Wear readout — only meaningful when a paint is applied (not vanilla). */
const getFloatValue = (weapon: WeaponItemData): string | null => {
  if (isVanillaSkin(weapon)) return null
  return weapon.databaseInfo?.paintwear ?? null
}

const handleDefaultWeaponClick = (team: number): void => {
  try {
    if (!team || (team !== 1 && team !== 2)) {
      throw new Error('Invalid team number provided')
    }
    if (!props.weaponData?.weapons?.[0]) {
      throw new Error('No weapon data available')
    }

    const firstWeapon = props.weaponData.weapons[0]

    const defaultWeapon: WeaponItemData = {
      type: 'weapon',
      id: `default-${firstWeapon.id || 'weapon'}`,
      name: `${props.weaponData.defaultName} | Default`,
      defaultName: props.weaponData.defaultName,
      image: firstWeapon.defaultImage,
      defaultImage: firstWeapon.defaultImage,
      itemName: firstWeapon.itemName,
      category: firstWeapon.category,
      minFloat: firstWeapon.minFloat || 0,
      maxFloat: firstWeapon.maxFloat || 1,
      availableTeams: firstWeapon.availableTeams || 'both',
      rarity: { id: 'default', name: 'Default', color: '#B0C3D9' },
      weapon_name: firstWeapon.weapon_name,
      weapon_defindex: firstWeapon.weapon_defindex || firstWeapon.databaseInfo?.defindex || 0,
      databaseInfo: {
        id: `default-db-${firstWeapon.id || 'weapon'}`,
        steamid: toSteamId(''),
        loadoutid: toLoadoutId(0),
        active: false,
        team: team,
        defindex: firstWeapon.databaseInfo?.defindex || toDefindex(0),
        paintindex: toPaintIndex(0),
        paintseed: '0',
        paintwear: '0.01',
        stattrak_enabled: false,
        stattrak_count: 0,
        nametag: '',
        sticker_0: '',
        sticker_1: '',
        sticker_2: '',
        sticker_3: '',
        sticker_4: '',
        keychain: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as DBWeapon,
    }

    emit('weaponClick', defaultWeapon)
  } catch (error: unknown) {
    console.error('Error handling default weapon click:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to select default weapon'
    emit('error', errorMessage)
  }
}

const handleQuickAction = (key: string, weapon: WeaponItemData) => {
  const action = key as 'generate' | 'import' | 'toggle' | 'reset'
  emit('quick-action', { action, weapon })
}

const handleSkinClick = (weapon: WeaponItemData): void => {
  try {
    if (!weapon) {
      throw new Error('Invalid weapon data provided')
    }
    emit('weaponClick', weapon)
  } catch (error: unknown) {
    console.error('Error handling skin click:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to select weapon skin'
    emit('error', errorMessage)
  }
}
</script>

<template>
  <div data-tutorial="weapon-card">
    <!-- State 1: Not configured — no DB entry for this weapon/team -->
    <ItemCard
      v-if="!hasCurrentTeamSkin"
      class="weapon-card"
      :name="weaponData.defaultName"
      :image-url="weaponData.weapons[0]?.defaultImage"
      :image-alt="weaponData.defaultName"
      state="unconfigured"
      :aria-label="`${weaponData.defaultName} — not configured, click to configure`"
      @click="handleDefaultWeaponClick(teamNumber)"
    />

    <!-- State 2 & 3: DB entry exists — vanilla skin or custom skin, active or inactive -->
    <ItemCard
      v-for="weapon in filteredWeapons"
      :key="weapon.paintindex"
      class="weapon-card"
      :name="getDisplayName(weapon).name"
      :sub-name="getDisplayName(weapon).sub"
      :image-url="weapon.image"
      :image-alt="weapon.name"
      :rarity-color="weapon.rarity?.color"
      :rarity-label="weapon.rarity?.name"
      :state="weapon.databaseInfo?.active ? 'normal' : 'inactive'"
      :stat-trak="weapon.databaseInfo?.stattrak_enabled === true"
      :float-value="getFloatValue(weapon)"
      :flip-id="`weapon-art-${weapon.weapon_defindex}`"
      :badge-text="
        isVanillaSkin(weapon) && weapon.databaseInfo?.active ? 'Vanilla' : undefined
      "
      :aria-label="`${getWeaponLabel(weapon)}${!weapon.databaseInfo?.active ? ', inactive' : ''}`"
      @click="handleSkinClick(weapon)"
    >
      <!-- Three-dots quick-action dropdown — only for configured cards -->
      <template #actions>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button
              variant="outline"
              size="icon-sm"
              :aria-label="`Actions for ${getWeaponLabel(weapon)}`"
            >
              <LucideEllipsisVertical :size="16" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              :disabled="weapon.databaseInfo?.paintindex === 0"
              @select="handleQuickAction('generate', weapon)"
            >
              <LucideLink :size="16" />
              Generate Inspect Link
            </DropdownMenuItem>
            <DropdownMenuItem @select="handleQuickAction('toggle', weapon)">
              <component :is="weapon.databaseInfo?.active ? LucideEyeOff : LucideEye" :size="16" />
              {{ weapon.databaseInfo?.active ? 'Deactivate' : 'Activate' }}
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" @select="handleQuickAction('reset', weapon)">
              <LucideRotateCcw :size="16" />
              Reset
            </DropdownMenuItem>
            <DropdownMenuItem @select="handleQuickAction('import', weapon)">
              <LucideImport :size="16" />
              Import From Link
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </template>
    </ItemCard>
  </div>
</template>
