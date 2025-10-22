import { defineConfig } from 'vitepress'

export default defineConfig({
  base: '/cs2inspect-web/',
  title: 'CS2 Inspect Web',
  description: 'Counter-Strike 2 Weapon Inspection Web Application',
  appearance: 'dark',
  ignoreDeadLinks: true,
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Documentation', link: '/docs-overview' },
      { text: 'Setup', link: '/setup' },
      { text: 'GitHub', link: 'https://github.com/sak0a/cs2inspect-web' }
    ],
    sidebar: [
      {
        text: 'Getting Started',
        items: [
          { text: 'Overview', link: '/docs-overview' },
          { text: 'Setup Guide', link: '/setup' },
          { text: 'How It Works', link: '/how-it-works' },
          { text: 'FAQ', link: '/faq' }
        ]
      },
      {
        text: 'Technical Documentation',
        items: [
          { text: 'Architecture', link: '/architecture' },
          { text: 'Components', link: '/components' },
          { text: 'API Reference', link: '/api' },
          { text: 'Health Checks', link: '/HEALTH_CHECKS' }
        ]
      },
      {
        text: 'Customization',
        items: [
          { text: 'Theme Customization', link: '/theme-customization' },
          { text: 'Glassmorphism', link: '/GLASSMORPHISM' },
          { text: 'Sticker Slots', link: '/StickerSlots' }
        ]
      },
      {
        text: 'Deployment & Contributing',
        items: [
          { text: 'Deployment Guide', link: '/deployment' },
          { text: 'Contributing', link: '/contributing' }
        ]
      }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/sak0a/cs2inspect-web' }
    ]
  }
})
