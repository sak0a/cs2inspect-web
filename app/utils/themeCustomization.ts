import type { ModalProps } from 'naive-ui'
type ModalThemeOverrides = NonNullable<ModalProps['themeOverrides']>

// Lighter glassmorphism for smaller attachment modals (stickers, keychains)
// Note: Main modal styling is now in ThemeProvider.vue as the global default
export const weaponAttachmentModalThemeOverrides: ModalThemeOverrides = {
    peers: {
        Card: {
            borderRadius: '20px',
            colorModal: 'rgba(16, 16, 16, 0.9)',
            boxShadow: `
        0 24px 48px rgba(0, 0, 0, 0.8),
        0 12px 24px rgba(0, 0, 0, 0.6),
        0 0 0 1px var(--glass-border-light),
        inset 0 1px 0 var(--glass-border-light)
      `,
        },
    },
}
