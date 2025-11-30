import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid({
  title: 'CS2Inspect Documentation',
  description: 'Comprehensive documentation for CS2Inspect - Counter-Strike 2 weapon inspection and loadout management',
  base: '/',
  
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#FACC15' }]
  ],

  themeConfig: {
    logo: '/logo.svg',
    
    nav: [
      { text: 'Home', link: '/' },
      { text: 'User Guide', link: '/user-guide' },
      { text: 'Setup', link: '/setup' },
      { text: 'API', link: '/api' },
      { text: 'GitHub', link: 'https://github.com/sak0a/cs2inspect-web' }
    ],

    sidebar: [
      {
        text: 'Getting Started',
        items: [
          { text: 'Overview', link: '/' },
          { text: 'User Guide', link: '/user-guide' },
          { text: 'Setup Guide', link: '/setup' },
          { text: 'How It Works', link: '/how-it-works' },
          { text: 'FAQ', link: '/faq' }
        ]
      },
      {
        text: 'Technical Documentation',
        items: [
          { text: 'Architecture', link: '/architecture' },
          { text: 'Frontend Architecture', link: '/architecture-frontend' },
          { text: 'Backend Architecture', link: '/architecture-backend' },
          { text: 'Deployment Architecture', link: '/architecture-deployment' },
          { text: 'Components', link: '/components' },
          { text: 'API Reference', link: '/api' }
        ]
      },
      {
        text: 'Deployment & Contributing',
        items: [
          { text: 'Deployment Guide', link: '/deployment' },
          { text: 'Contributing Guide', link: '/contributing' }
        ]
      },
      {
        text: 'Additional Resources',
        items: [
          { text: 'Health Checks', link: '/HEALTH_CHECKS' },
          { text: 'Theme Customization', link: '/theme-customization' },
          { text: 'Sticker Slots', link: '/StickerSlots' },
          { text: 'Glassmorphism', link: '/GLASSMORPHISM' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/sak0a/cs2inspect-web' }
    ],

    search: {
      provider: 'local'
    },

    footer: {
      message: 'Built with ❤️ by the CS2Inspect community',
      copyright: 'Copyright © 2025 CS2Inspect'
    },

    editLink: {
      pattern: 'https://github.com/sak0a/cs2inspect-web/edit/main/site/:path',
      text: 'Edit this page on GitHub'
    },

    lastUpdated: {
      text: 'Last updated',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'medium'
      }
    }
  },

  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    },
    lineNumbers: true
  },

  mermaid: {
    theme: 'dark'
  }
})
