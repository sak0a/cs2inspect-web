// https://nuxt.com/docs/api/configuration/nuxt-config
import Components from 'unplugin-vue-components/vite'
import { defineNuxtConfig } from "nuxt/config";
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'

export default defineNuxtConfig({
  ssr: true,
  target: 'server',
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
  hooks: {
    'app:before': async () => {
      const { initializeDatabase } = require('./server/utils/database');
      await initializeDatabase();
    }
  },
  css: [
    '~/assets/css/tailwind.sass',
  ],
  vite: {
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
  monacoEditor: {
    // These are default values:
    locale: 'en',
    componentName: {
      codeEditor: 'MonacoEditor',
      diffEditor: 'MonacoDiffEditor'
    }
  },
  modules: [
    '@nuxt/test-utils/module',
    '@nuxtjs/tailwindcss',
    'nuxt-mdi',
    'google-fonts',
    'nuxt-monaco-editor',
    '@nuxtjs/color-mode',
    'nuxtjs-naive-ui',
    '@nuxt/eslint',
  ],
  compatibilityDate: '2024-10-12',
})