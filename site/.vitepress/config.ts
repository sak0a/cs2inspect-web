import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid(defineConfig({
  base: '/cs2inspect-web/',
  title: 'CS2 Inspect Web',
  description: 'Counter-Strike 2 Weapon Inspection Web Application',
  appearance: 'force-dark', // Force dark mode, disable toggle
  ignoreDeadLinks: true,
  lastUpdated: true, // Enable last updated timestamps
  markdown: {
    theme: {
      light: 'github-dark',
      dark: 'github-dark'
    }
  },
  mermaid: {
    // Mermaid configuration for dark theme
    theme: 'dark',
    themeVariables: {
      primaryColor: '#FACC15',
      primaryTextColor: '#fff',
      primaryBorderColor: '#F59E0B',
      lineColor: '#F59E0B',
      secondaryColor: '#CA8A04',
      tertiaryColor: '#1a1a1a',
      background: '#121212',
      mainBkg: '#1a1a1a',
      secondBkg: '#242424',
      tertiaryBkg: '#2c2c2c',
      textColor: '#ffffff',
      border1: '#333333',
      border2: '#444444',
      fontSize: '16px'
    }
  },
  themeConfig: {
    search: {
      provider: 'local'
    },
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
        text: 'Deployment',
        collapsed: false,
        items: [
          { text: 'Overview', link: '/deployment' },
          {
            text: 'Deployment Options',
            collapsed: true,
            items: [
              { text: 'Vercel (Recommended)', link: '/deployment#_1-vercel-recommended' },
              { text: 'Docker', link: '/deployment#_2-docker-deployment' },
              { text: 'Node.js + PM2', link: '/deployment#_3-node-js-pm2' },
              { text: 'Other Platforms', link: '/deployment#_4-other-platforms' }
            ]
          },
          { text: 'Database Setup', link: '/deployment#database-setup' },
          { text: 'Health Monitoring', link: '/deployment#health-monitoring' },
          { text: 'Troubleshooting', link: '/deployment#troubleshooting-deployment-issues' }
        ]
      },
      {
        text: 'Integrations',
        items: [
          { text: 'CS2Inspect Plugin', link: '/plugin-integration' }
        ]
      },
      {
        text: 'Contributing',
        items: [
          { text: 'Contributing Guide', link: '/contributing' }
        ]
      }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/sak0a/cs2inspect-web' }
    ]
  }
}))
