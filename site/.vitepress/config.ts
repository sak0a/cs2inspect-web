import { defineConfig } from 'vitepress'

export default defineConfig({
  base: '/cs2inspect-web/',
  title: 'CS2 Inspect Web',
  description: 'Counter-Strike 2 Weapon Inspection Web Application',
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'GitHub', link: 'https://github.com/sak0a/cs2inspect-web' }
    ],
    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Getting Started', link: '/guide/getting-started' },
          { text: 'Configuration', link: '/guide/configuration' }
        ]
      },
      {
        text: 'API Reference',
        items: [
          { text: 'Overview', link: '/api/overview' }
        ]
      }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/sak0a/cs2inspect-web' }
    ]
  }
})
