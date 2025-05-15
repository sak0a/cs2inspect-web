import { WeaponCustomization, WeaponStickerCustomization, WeaponKeychainCustomization } from './interfaces';
import { Sticker } from './csinspect/base';

/**
 * Maps the customization data from the frontend format to the format required by the inspect URL generator
 */
export function mapCustomizationToRepresentation(customization: WeaponCustomization) {
  // Map stickers to the format required by the inspect URL generator
  const stickers = customization.stickers
    .map((sticker, index) => {
      if (!sticker) return null;
      return {
        slot: index,
        sticker_id: sticker.id,
        wear: sticker.wear,
        scale: sticker.scale,
        rotation: sticker.rotation,
        offset_x: sticker.x,
        offset_y: sticker.y,
      } as Sticker;
    })
    .filter((sticker): sticker is Sticker => sticker !== null);

  // Map keychain to the format required by the inspect URL generator
  const keychain = customization.keychain ? {
    slot: 0,
    sticker_id: customization.keychain.id,
    offset_x: customization.keychain.x,
    offset_y: customization.keychain.y,
    offset_z: customization.keychain.z,
    pattern: customization.keychain.seed
  } as Sticker : null;

  return {
    stickers,
    keychain
  };
}
