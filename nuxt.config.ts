// https://nuxt.com/docs/api/configuration/nuxt-config
import Components from 'unplugin-vue-components/vite'
import { defineNuxtConfig } from "nuxt/config";
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'

export default defineNuxtConfig({
  $development: undefined, $env: undefined, $meta: undefined, $production: undefined, $test: undefined,
  ssr: true,
  server: {
    port: process.env.PORT || 3000,  // default: 3000
    host: process.env.HOST || '0.0.0.0',  // default: localhost
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
    }
  },
  css: [
    '~/assets/css/tailwind.sass',
  ],
  router: {
    options: {
      hashMode: false // Ensure this is set to false for proper URL handling
    }
  },
  vite: {
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
    ]
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
  ],
  compatibilityDate: '2024-10-12'
})