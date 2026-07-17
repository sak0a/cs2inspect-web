import type { InjectionKey } from 'vue'

/**
 * Modal stacking channel (design spec §6/§8).
 *
 * Every `AppModal` provides a registration function under `modalStackKey` and
 * injects its nearest ancestor's. When a nested AppModal (sticker/keychain/
 * reset/… — they all render inside the parent modal's default slot, so the
 * component chain carries the injection) becomes visible it registers with
 * its parent, which scales its own panel to 0.985 / opacity 0.8 while any
 * descendant is open and restores when the count returns to zero.
 *
 * The returned release function is idempotent — safe to call from both the
 * close watcher and unmount cleanup.
 */
export type ModalStackRegister = () => () => void

export const modalStackKey: InjectionKey<ModalStackRegister> = Symbol('app-modal-stack')
