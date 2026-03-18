import type { DBWeapon, WeaponConfiguration } from '~/types'
import type { SteamUser } from '~/services/steamAuth'
import type { LoadoutId } from '~/types'
import type { EconItem } from 'cs2-inspect-lib'
import type { APISticker, APIKeychain } from '~/server/types'

interface UseWeaponQuickActionsOptions {
  user: Ref<SteamUser | null>
  loadoutId: Ref<LoadoutId | null>
  weaponType: string
  onSuccess: () => Promise<void>
}

function dbWeaponToConfig(db: DBWeapon): WeaponConfiguration {
  const stickers = [db.sticker_0, db.sticker_1, db.sticker_2, db.sticker_3, db.sticker_4].map(
    (s) => {
      if (!s) return null
      try {
        return JSON.parse(s)
      } catch {
        return null
      }
    },
  )

  let keychain = null
  if (db.keychain) {
    try {
      keychain = JSON.parse(db.keychain)
    } catch {
      keychain = null
    }
  }

  return {
    active: db.active,
    team: db.team,
    defindex: db.defindex,
    paintindex: db.paintindex,
    paintIndexOverride: false,
    paintseed: parseInt(String(db.paintseed)) || 0,
    paintwear: parseFloat(String(db.paintwear)) || 0,
    stattrak_enabled: db.stattrak_enabled,
    stattrak_count: db.stattrak_count,
    nametag: db.nametag,
    stickers,
    keychain,
  }
}

export function useWeaponQuickActions(options: UseWeaponQuickActionsOptions) {
  const { user, loadoutId, weaponType, onSuccess } = options
  const { t } = useI18n()
  const message = useMessage()
  const isLoading = ref(false)

  const save = async (
    defindex: number,
    team: number,
    config: Partial<WeaponConfiguration> & { reset?: boolean },
  ) => {
    if (!user.value || !loadoutId.value) {
      throw new Error('Missing user or loadout')
    }

    const result = await $fetch<{ success: boolean; message: string }>(
      `/api/items/weapons/save?steamId=${user.value.steamId}&loadoutId=${loadoutId.value}&type=${weaponType}`,
      {
        method: 'POST',
        body: { defindex, team, ...config },
      },
    )

    if (!result.success) {
      throw new Error(result.message)
    }

    await onSuccess()
  }

  const generateLink = async (defindex: number, dbWeapon: DBWeapon) => {
    if (!user.value) {
      message.error('Missing user data')
      return
    }

    if (!dbWeapon.paintindex || dbWeapon.paintindex === 0) {
      message.error(t('modals.weaponSkin.generateInspectUrlFailed') as string)
      return
    }

    try {
      isLoading.value = true
      const config = dbWeaponToConfig(dbWeapon)

      const data = await $fetch<{ inspectUrl: string; message?: string }>(
        `/api/inspect?action=create-url&steamId=${user.value.steamId}`,
        {
          method: 'POST',
          body: {
            itemType: 'weapon',
            defindex,
            paintindex: config.paintindex,
            paintseed: config.paintseed,
            paintwear: config.paintwear,
            rarity: 0,
            stattrak_enabled: config.stattrak_enabled,
            stattrak_count: config.stattrak_count,
            nametag: config.nametag,
            customization: config,
          },
        },
      )

      await navigator.clipboard.writeText(data.inspectUrl)
      message.success(t('modals.weaponSkin.generateInspectUrlSuccess') as string, {
        duration: 3000,
      })
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : (t('modals.weaponSkin.generateInspectUrlFailed') as string)
      message.error(errorMessage)
      console.error('Error creating inspect link:', error)
    } finally {
      isLoading.value = false
    }
  }

  const importFromLink = async (
    defindex: number,
    team: number,
    inspectUrl: string,
  ): Promise<WeaponConfiguration> => {
    if (!user.value) {
      throw new Error('Missing user data')
    }

    const data = await $fetch<{ item: EconItem; message?: string }>(
      `/api/inspect?action=inspect-item&steamId=${user.value.steamId}`,
      {
        method: 'POST',
        body: { inspectUrl, itemType: 'weapon' },
      },
    )

    if (data.item.defindex !== defindex) {
      throw new Error(t('modals.weaponSkin.importFailedNoMatchingWeapon') as string)
    }

    const stickerPromises =
      data.item.stickers?.map(
        async (
          sticker: {
            sticker_id: number
            offset_x?: number
            offset_y?: number
            wear?: number
            scale?: number
            rotation?: number
          },
          index: number,
        ) => {
          if (!sticker) return null
          const stickerResponse = await $fetch<{ success: boolean; data: APISticker[] }>(
            `/api/data/stickers?id=sticker-${sticker.sticker_id}`,
          )
          const stickerData = stickerResponse.data?.[0]
          if (!stickerData) return null

          return {
            id: sticker.sticker_id,
            x: sticker.offset_x || 0,
            y: sticker.offset_y || 0,
            wear: sticker.wear || 0,
            scale: sticker.scale || 1,
            rotation: sticker.rotation || 0,
            index,
            api: {
              name: stickerData.name,
              image: stickerData.image,
              type: stickerData.type,
              effect: stickerData.effect,
              tournament_event: stickerData.tournament_event,
              tournament_team: stickerData.tournament_team,
              rarity: stickerData.rarity,
            },
          }
        },
      ) || []

    let keychainPromise
    const itemKeychain = data.item.keychains?.[0]
    if (itemKeychain) {
      keychainPromise = $fetch<{ success: boolean; data: APIKeychain[] }>(
        `/api/data/keychains?id=keychain-${itemKeychain.sticker_id}`,
      ).then((keychainData) => {
        const keychain = keychainData.data?.[0]
        if (!keychain) return null

        return {
          id: itemKeychain.sticker_id,
          name: keychain.name || 'Unknown Keychain',
          image: keychain.image || '',
          x: 0,
          y: 0,
          z: itemKeychain.offset_z || 0,
          offset_x: itemKeychain.offset_x || 0,
          offset_y: itemKeychain.offset_y || 0,
          offset_z: itemKeychain.offset_z || 0,
          seed: itemKeychain.pattern || 0,
          api: {
            name: keychain.name,
            image: keychain.image,
            rarity: keychain.rarity,
          },
        }
      })
    }

    const [stickerResults, keychainData] = await Promise.all([
      Promise.all(stickerPromises),
      keychainPromise,
    ])

    const stickers = Array(5).fill(null)
    stickerResults
      .filter((s): s is NonNullable<typeof s> => s !== null)
      .sort((a, b) => a.index - b.index)
      .forEach((stickerData, index) => {
        if (stickerData && index < 5) {
          const { index: _, ...stickerWithoutIndex } = stickerData
          stickers[index] = stickerWithoutIndex
        }
      })

    return {
      active: true,
      team,
      defindex: data.item.defindex,
      paintindex: data.item.paintindex,
      paintIndexOverride: false,
      paintseed: data.item.paintseed,
      paintwear: data.item.paintwear,
      stattrak_enabled: data.item.killeaterscoretype !== null,
      stattrak_count: data.item.killeatervalue || 0,
      nametag: data.item.customname || '',
      stickers,
      keychain: keychainData ?? null,
    }
  }

  const reset = async (defindex: number, team: number) => {
    try {
      isLoading.value = true
      await save(defindex, team, { reset: true })
      message.success(t('modals.weaponSkin.resetSuccess') as string, { duration: 3000 })
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : (t('modals.weaponSkin.resetFailed') as string)
      message.error(errorMessage)
      console.error('Error resetting weapon:', error)
    } finally {
      isLoading.value = false
    }
  }

  const toggleActive = async (defindex: number, dbWeapon: DBWeapon) => {
    try {
      isLoading.value = true
      const config = dbWeaponToConfig(dbWeapon)
      config.active = !config.active
      await save(defindex, dbWeapon.team, config)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to toggle active state'
      message.error(errorMessage)
      console.error('Error toggling active state:', error)
    } finally {
      isLoading.value = false
    }
  }

  return {
    generateLink,
    importFromLink,
    reset,
    toggleActive,
    save,
    isLoading,
  }
}
