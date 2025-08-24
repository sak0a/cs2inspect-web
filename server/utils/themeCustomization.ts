import type { ModalProps, CardProps, LayoutProps } from 'naive-ui'
type ModalThemeOverrides = NonNullable<ModalProps['themeOverrides']>
type CardThemeOverrides = NonNullable<CardProps['themeOverrides']>
type LayoutThemeOverrides = NonNullable<LayoutProps['themeOverrides']>

const skinModalCardThemeOverrides: CardThemeOverrides = {
  borderRadius: '20px',
  colorModal: '#101010'
}

export const skinModalThemeOverrides: ModalThemeOverrides  = {
  peers: {
    Card: skinModalCardThemeOverrides
  }
}

export const weaponAttachmentModalThemeOverrides: ModalThemeOverrides = {
  peers: {
    Card: {
      borderRadius: '20px',
      colorModal: '#101010'
    }
  }
}

export const layoutThemeOverrides: LayoutThemeOverrides = {
  color: '#101010',
  colorModal: '#101010',
  siderColor: '#101010'
}
