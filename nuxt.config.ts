// https://nuxt.com/docs/api/configuration/nuxt-config
import Components from 'unplugin-vue-components/vite'
import { defineNuxtConfig } from "nuxt/config";
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'

export default defineNuxtConfig({
  $development: undefined, $env: undefined, $meta: undefined, $production: undefined, $test: undefined,
  ssr: true,
  
  // Performance optimizations
  experimental: {
    payloadExtraction: true,
    renderJsonPayloads: true,
    viewTransition: true
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
    compressPublicAssets: {
      gzip: true,
      brotli: true
    },
    prerender: {
      crawlLinks: true,
      routes: ['/']
    }
  },
  devServer: {
    port: Number(process.env.PORT),  // default: 3000
    host: process.env.HOST,
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
      link: [
        // Preconnect to critical origins
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'dns-prefetch', href: 'https://fonts.gstatic.com' }
      ]
    }
  },
  css: [
    '~/assets/css/tailwind.sass',
    '~/assets/css/transitions.sass',
    '~/assets/css/theme-variables.css',
    '~/assets/css/glassmorphism.css',
  ],
  router: {
    options: {
      hashMode: false, // Ensure this is set to false for proper URL handling
      scrollBehaviorType: 'smooth'
    }
  },
  
  // Route-level optimizations
  routeRules: {
    // Prerender static pages at build time
    '/': { prerender: true },
    '/agents/**': { swr: 3600 }, // Cache for 1 hour with stale-while-revalidate
    '/gloves/**': { swr: 3600 },
    '/knifes/**': { swr: 3600 },
    '/music-kits/**': { swr: 3600 },
    '/pins/**': { swr: 3600 },
    '/weapons/**': { swr: 3600 },
    // API routes with caching
    '/api/data/**': { 
      cache: { 
        maxAge: 3600, // 1 hour cache
        swr: true 
      }
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
          api: 'modern',
        },
      },
    },
    plugins: [
      Components({
        resolvers: [NaiveUiResolver()]
      })
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Split vendor chunks for better caching
            if (id.includes('node_modules')) {
              if (id.includes('naive-ui')) {
                return 'naive-ui';
              }
              if (id.includes('chart.js') || id.includes('vue-chartjs')) {
                return 'charts';
              }
              if (id.includes('@vueuse')) {
                return 'vueuse';
              }
              if (id.includes('pinia')) {
                return 'pinia';
              }
              return 'vendor';
            }
          }
        }
      },
      cssCodeSplit: true,
      // Enable minification
      minify: 'esbuild',
      // Optimize chunk sizes
      chunkSizeWarningLimit: 600
    }
  },
  tailwindcss: {
    cssPath: ['~/assets/css/tailwind.sass', { injectPosition: "first" }],
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
  ],
  i18n: {
    locales: [
      { code: 'en', iso: 'en-US', displayName: 'English' },
      { code: 'de', iso: 'de-DE', displayName: 'Deutsch' },
      { code: 'ru', iso: 'ru-RU', displayName: 'Русский' },
    ],
    defaultLocale: 'en',
    translationDir: 'locales',
    meta: true,
    localeCookie: 'i18n_locale',
    strategy: 'no_prefix'
  },
    hooks: {
    'close': async () => {
        setTimeout(() => {
            console.log("Closing...")
            process.exit(0)
        }, 1000)
    }
  },
  compatibilityDate: '2024-10-12'
})