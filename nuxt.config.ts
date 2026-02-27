// https://nuxt.com/docs/api/configuration/nuxt-config
import Components from 'unplugin-vue-components/vite'
import { defineNuxtConfig } from "nuxt/config";
import { fileURLToPath } from 'node:url'
import { existsSync, readFileSync } from 'node:fs'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'

export default defineNuxtConfig({
  alias: {
    '~/server': fileURLToPath(new URL('./server', import.meta.url)),
  },
  $development: undefined, $env: undefined, $meta: undefined, $production: undefined, $test: undefined,
  ssr: true,
  imports: {
    dirs: ['stores', 'composables', 'utils', 'middleware'],
    presets: [
      {
        from: 'naive-ui',
        imports: [
          'useMessage',
          'useNotification',
          'useDialog',
          'useTheme',
          'useLoading'
        ],
      }
    ],
  },
  typescript: {
    typeCheck: false,
  },
  experimental: {
    typedPages: true,
    buildCache: true,
    asyncContext: true,
  },
  nitro: {
    experimental: {
      wasm: true
    },
    esbuild: {
      options: {
        target: 'esnext'
      }
    },
    minify: true,
    node: true
  },
  devServer: {
    port: Number(process.env.PORT) || 3210,
    host: process.env.HOST || 'localhost',
  },
  devtools: {
    enabled: true,
  },
  build: {
    transpile: ['vueuc']
  },
  app: {
    pageTransition: {
      name: 'page',
      mode: 'out-in'
    },
    layoutTransition: {
      name: 'layout',
      mode: 'out-in'
    },
    head: {
      titleTemplate: '%s | CS2 Inspect',
      title: 'CS2 Inspect',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Inspect CS2 Skins on generic server with any float, pattern and sticker combination.' },
        { name: 'theme-color', content: '#000000' },
        { property: 'og:title', content: 'CS2 Inspect' },
        { property: 'og:description', content: 'Inspect CS2 Skins on generic server with any float, pattern and sticker combination.' },
        { property: 'og:type', content: 'website' },
        // { property: 'og:image', content: '/og-image.png' }, // TODO: Add OG Image
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  },
  css: [
    '~/assets/css/tailwind.css',
    '~/assets/css/transitions.sass',
    '~/assets/css/theme-variables.css',
    '~/assets/css/glassmorphism.css',
    '~/assets/css/tutorial.css',
  ],
  router: {
    options: {
      hashMode: false // Ensure this is set to false for proper URL handling
    }
  },
  vite: {
    vue: {
      script: {
        // Force the SFC compiler's type resolver to use Node.js's real filesystem.
        // Without this, type resolution for defineProps<ImportedType>() fails in
        // Docker builds due to path alias resolution issues with the default ts.sys.
        fs: {
          fileExists: (file: string) => existsSync(file),
          readFile: (file: string) => {
            try { return readFileSync(file, 'utf-8') } catch { return undefined }
          },
        },
      },
    },
    optimizeDeps: {
      exclude: ['oxc-parser']
    },
    ssr: {
      noExternal: ['naive-ui']
    },
    css: {
      preprocessorOptions: {
        sass: {
          // Modern SASS API is default in newer versions
        },
      },
    },
    server: {
      watch: {
        usePolling: false,
        interval: 1000,
        ignored: [
          '**/public/img/charms/**',
          '**/public/img/weapons/**',
          '**/storage/stickers/**',
        ]
      }
    },
    plugins: [
      Components({
        resolvers: [NaiveUiResolver()]
      }) as unknown as { name: string }
    ]
  },
  tailwindcss: {
    cssPath: ['~/assets/css/tailwind.css', { injectPosition: "first" }],
    exposeConfig: {
      level: 2
    },
    config: {},
    viewer: false,
  },
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxt/test-utils/module',
    'nuxt-lucide-icons',
    'nuxtjs-naive-ui',
    '@nuxt/eslint',
    '@pinia/nuxt',
    'nuxt-i18n-micro',
    // TODO: Enable @nuxtjs/seo once OG images and site metadata are finalized
    // TODO: Enable @vite-pwa/nuxt once service worker strategy is validated (see pwa config below)
  ],
  runtimeConfig: {
    public: {
      assetsUrl: process.env.ASSETS_URL || 'https://assets.cu.sakoa.xyz/cs2inspect',
      assetsStickerPath: process.env.ASSETS_STICKER_PATH || '/stickers',
      assetsCharmsPath: process.env.ASSETS_CHARMS_PATH || '/charms',
      assetsWeaponsPath: process.env.ASSETS_WEAPONS_PATH || '/weapons',
    }
  },
  // PWA config ready to enable — uncomment @vite-pwa/nuxt module above and this block
  // pwa: {
  //   manifest: {
  //     name: 'CS2 Inspect',
  //     short_name: 'CS2 Inspect',
  //     description: 'Inspect CS2 Skins on generic server with any float, pattern and sticker combination.',
  //     theme_color: '#000000',
  //   },
  //   workbox: { navigateFallback: '/' },
  // },
  i18n: {
    locales: [
      { code: 'en', iso: 'en-US', displayName: 'English' },
      { code: 'de', iso: 'de-DE', displayName: 'Deutsch' },
      { code: 'ru', iso: 'ru-RU', displayName: 'Русский' },
      { code: 'fr', iso: 'fr-FR', displayName: 'Français' },
      { code: 'es', iso: 'es-ES', displayName: 'Español' },
      { code: 'nl', iso: 'nl-NL', displayName: 'Nederlands' },
    ],
    defaultLocale: 'en',
    translationDir: 'app/locales',
    meta: true,
    localeCookie: 'i18n_locale',
    strategy: 'no_prefix'
  },
  hooks: {
    'close': async () => {
      if (process.argv.includes('typecheck') || process.argv.includes('lint') || process.argv.includes('analyze')) return
      setTimeout(() => {
        console.log("Closing...")
        process.exit(0)
      }, 1000)
    }
  },
  
  routeRules: {
    '/admin/**': { ssr: false },
    '/auth/**': { ssr: false },
    '/dev': { ssr: false },
    '/status': { swr: 60 },
    '/api/data/**': { swr: 300 },
  },

  compatibilityDate: '2025-04-01'
})