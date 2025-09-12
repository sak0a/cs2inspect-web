import type { ModalProps, CardProps, LayoutProps } from 'naive-ui'
type ModalThemeOverrides = NonNullable<ModalProps['themeOverrides']>
type CardThemeOverrides = NonNullable<CardProps['themeOverrides']>
type LayoutThemeOverrides = NonNullable<LayoutProps['themeOverrides']>

// Glassmorphism modal card theme with backdrop blur and transparency
const glassmorphismModalCardThemeOverrides: CardThemeOverrides = {
  borderRadius: '24px',
  // Semi-transparent background for glassmorphism effect (CSS variables will override this)
  colorModal: 'var(--glass-bg-primary)',
  // Enhanced shadow with multiple layers for depth
  boxShadow: `
    0 32px 64px rgba(0, 0, 0, 0.9),
    0 16px 32px rgba(0, 0, 0, 0.7),
    0 8px 16px rgba(0, 0, 0, 0.5),
    0 0 0 1px var(--glass-border),
    inset 0 1px 0 var(--glass-border)
  `,
  // Border for glassmorphism effect
  border: '1px solid var(--glass-border)'
}

// Standard glassmorphism theme for main modals
export const skinModalThemeOverrides: ModalThemeOverrides = {
  peers: {
    Card: glassmorphismModalCardThemeOverrides
  }
}

// Lighter glassmorphism for smaller attachment modals
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
      border: '1px solid var(--glass-border-light)'
    }
  }
}

export const layoutThemeOverrides: LayoutThemeOverrides = {
  color: '#101010',
  colorModal: '#101010',
  siderColor: '#101010'
}
