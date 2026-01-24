// https://nuxt.com/docs/api/configuration/nuxt-config
import Components from 'unplugin-vue-components/vite'
import { defineNuxtConfig } from "nuxt/config";
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'

export default defineNuxtConfig({
  $development: undefined, $env: undefined, $meta: undefined, $production: undefined, $test: undefined,
  ssr: true,
  imports: {
    dirs: ['stores', 'composables', 'utils', 'server/utils', 'middleware'],
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
    minify: false,
    // Serve stickers from storage folder (moved out of public to avoid 200k+ file scan)
    serverAssets: [
      {
        baseName: 'stickers',
        dir: './storage/stickers'
      }
    ],
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
  ],
  router: {
    options: {
      hashMode: false // Ensure this is set to false for proper URL handling
    }
  },
  vite: {
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
        interval: 1000
      }
    },
    plugins: [
      Components({
        resolvers: [NaiveUiResolver()]
      })
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
    'nuxt-mdi',
    'nuxtjs-naive-ui',
    '@nuxt/eslint',
    '@pinia/nuxt',
    'nuxt-i18n-micro',
    //'@nuxtjs/seo',
    '@vite-pwa/nuxt',
  ],
  // site: { // Commented out until @nuxtjs/seo is enabled
  //   url: 'https://cs2inspect.com',
  //   name: 'CS2 Inspect',
  //   description: 'Inspect CS2 Skins on generic server with any float, pattern and sticker combination.',
  //   defaultLocale: 'en',
  // },
  runtimeConfig: {
    public: {
      assetsUrl: process.env.ASSETS_URL || 'https://assets.cu.sakoa.xyz/cs2inspect',
      assetsStickerPath: process.env.ASSETS_STICKER_PATH || '/stickers',
      assetsCharmsPath: process.env.ASSETS_CHARMS_PATH || '/charms',
      assetsWeaponsPath: process.env.ASSETS_WEAPONS_PATH || '/weapons',
    }
  },
  pwa: {
    manifest: {
      name: 'CS2 Inspect',
      short_name: 'CS2 Inspect',
      description: 'Inspect CS2 Skins on generic server with any float, pattern and sticker combination.',
      theme_color: '#000000',
      icons: [
        {
          src: 'android-chrome-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: 'android-chrome-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        },
      ],
    },
    workbox: {
      navigateFallback: '/',
    },
    devOptions: {
      enabled: true,
      type: 'module',
    },
  },
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
    translationDir: 'locales',
    meta: true,
    localeCookie: 'i18n_locale',
    strategy: 'no_prefix'
  },
  hooks: {
    'close': async () => {
      if (process.argv.includes('typecheck')) return
      setTimeout(() => {
        console.log("Closing...")
        process.exit(0)
      }, 1000)
    }
  },
  compatibilityDate: '2024-10-12'
})