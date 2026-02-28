import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid({
    title: 'CS2Inspect Documentation',
    description:
        'Comprehensive documentation for CS2Inspect - Counter-Strike 2 weapon inspection and loadout management',
    base: '/cs2inspect-web/',
    appearance: false,

    head: [
        ['link', { rel: 'icon', href: '/cs2inspect-web/favicon.ico' }],
        ['meta', { name: 'theme-color', content: '#FACC15' }],
    ],

    themeConfig: {
        logo: '/logo.svg',

        nav: [
            { text: 'Home', link: '/' },
            { text: 'User Guide', link: '/user-guide' },
            { text: 'Deploy', link: '/self-hosting' },
            { text: 'Plugin', link: '/plugin/' },
            { text: 'API', link: '/api/' },
        ],

        sidebar: {
            '/': [
                {
                    text: 'Web Application',
                    items: [
                        { text: 'Overview', link: '/' },
                        { text: 'User Guide', link: '/user-guide' },
                        { text: 'How It Works', link: '/how-it-works' },
                        { text: 'FAQ', link: '/faq' },
                    ],
                },
                {
                    text: 'Server Setup',
                    items: [
                        { text: 'Self-Hosting Guide', link: '/self-hosting' },
                        { text: 'Deployment Options', link: '/deployment' },
                        { text: 'Coolify Deployment', link: '/coolify' },
                    ],
                },
                {
                    text: 'Features',
                    items: [
                        { text: 'Version History', link: '/version-history' },
                        { text: 'Admin Panel', link: '/admin' },
                    ],
                },
                {
                    text: 'Development',
                    items: [
                        { text: 'Development Setup', link: '/setup' },
                        { text: 'Architecture', link: '/architecture' },
                        { text: 'Frontend Architecture', link: '/architecture-frontend' },
                        { text: 'Backend Architecture', link: '/architecture-backend' },
                        { text: 'Deployment Architecture', link: '/architecture-deployment' },
                        { text: 'Components', link: '/components' },
                        { text: 'GitHub Actions CI/CD', link: '/github-actions' },
                        { text: 'Contributing Guide', link: '/contributing' },
                    ],
                },
                {
                    text: 'Services',
                    items: [
                        { text: 'Steam Service', link: '/services-steam' },
                        { text: 'Asset Scrapers', link: '/services-scrapers' },
                    ],
                },
                {
                    text: 'Reference',
                    items: [
                        { text: 'Composables', link: '/reference-composables' },
                        { text: 'Pinia Stores', link: '/reference-stores' },
                        { text: 'TypeScript Types', link: '/reference-types' },
                        { text: 'Environment Variables', link: '/reference-env' },
                        { text: 'Health Checks', link: '/HEALTH_CHECKS' },
                    ],
                },
                {
                    text: 'Additional Resources',
                    items: [
                        { text: 'Theme Customization', link: '/theme-customization' },
                        { text: 'Sticker Slots', link: '/StickerSlots' },
                        { text: 'Glassmorphism', link: '/GLASSMORPHISM' },
                        { text: 'Recommendations', link: '/recommendations' },
                        { text: 'Improvements Summary', link: '/improvements-summary' },
                    ],
                },
            ],
            '/plugin/': [
                {
                    text: 'CS2 Plugin',
                    items: [
                        { text: 'Overview', link: '/plugin/' },
                        { text: 'Commands', link: '/plugin/commands' },
                        { text: 'Configuration', link: '/plugin/configuration' },
                        { text: 'Config Generator', link: '/plugin/config-generator' },
                    ],
                },
                {
                    text: 'Web Application',
                    items: [
                        { text: 'User Guide', link: '/user-guide' },
                        { text: 'Self-Hosting Guide', link: '/self-hosting' },
                        { text: 'How It Works', link: '/how-it-works' },
                    ],
                },
            ],
            '/api/': [
                {
                    text: 'API Reference',
                    items: [
                        { text: 'Overview', link: '/api/' },
                        { text: 'Authentication', link: '/api/authentication' },
                        { text: 'Health Checks', link: '/api/health' },
                        { text: 'Data Endpoints', link: '/api/data' },
                        { text: 'Loadouts', link: '/api/loadouts' },
                        { text: 'Items', link: '/api/items' },
                        { text: 'Inspect System', link: '/api/inspect' },
                        { text: 'Admin API', link: '/api/admin' },
                        { text: 'Error Handling', link: '/api/errors' },
                    ],
                },
                {
                    text: 'Auto-Generated',
                    collapsed: true,
                    items: [
                        { text: 'All Endpoints', link: '/api/api-reference' },
                        { text: 'Auth', link: '/api/api-auth' },
                        { text: 'Health', link: '/api/api-health' },
                        { text: 'Inspect', link: '/api/api-inspect' },
                        { text: 'Loadouts', link: '/api/api-loadouts' },
                        { text: 'History', link: '/api/api-history' },
                        { text: 'Weapons', link: '/api/api-weapons' },
                        { text: 'Knives', link: '/api/api-knives' },
                        { text: 'Gloves', link: '/api/api-gloves' },
                        { text: 'Pins', link: '/api/api-pins' },
                        { text: 'Data', link: '/api/api-data' },
                        { text: 'Proxy', link: '/api/api-proxy' },
                    ],
                },
            ],
        },

        socialLinks: [{ icon: 'github', link: 'https://github.com/sak0a/cs2inspect-web' }],

        search: {
            provider: 'local',
        },

        footer: {
            message: 'Built with ❤️ by the CS2Inspect community',
            copyright: 'Copyright © 2026 CS2Inspect',
        },

        editLink: {
            pattern: 'https://github.com/sak0a/cs2inspect-web/edit/master/services/docs-site/:path',
            text: 'Edit this page on GitHub',
        },

        lastUpdated: {
            text: 'Last updated',
            formatOptions: {
                dateStyle: 'short',
                timeStyle: 'medium',
            },
        },
    },

    // Ignore dead links from migrated docs (can be fixed later)
    ignoreDeadLinks: [
        // Relative links that need fixing
        /\.\/\.$/,
        /\.\.\/HEALTH_CHECKS$/,
        /\.\.\/CS2_INSPECT_SYSTEM_README$/,
        /\.\.\/types\/README$/,
        /\.\.\/setup$/,
        /\.\/README$/,
        // Localhost links
        /^http:\/\/localhost/,
    ],

    markdown: {
        theme: {
            light: 'github-light',
            dark: 'github-dark',
        },
        lineNumbers: true,
    },

    mermaid: {
        theme: 'dark',
    },
})
