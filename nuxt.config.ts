// https://nuxt.com/docs/api/configuration/nuxt-config
import Components from 'unplugin-vue-components/vite'
import { defineNuxtConfig } from "nuxt/config";
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'

export default defineNuxtConfig({
  $development: undefined, $env: undefined, $meta: undefined, $production: undefined, $test: undefined,
  ssr: true,
  devServer: {
    port: Number(process.env.PORT),  // default: 3000
    host: process.env.HOST,  // default: localhost
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
    }
  },
  css: [
    '~/assets/css/tailwind.sass',
    '~/assets/css/transitions.css',
  ],
  router: {
    options: {
      hashMode: false // Ensure this is set to false for proper URL handling
    }
  },
  vite: {
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
  compatibilityDate: '2024-10-12'
})