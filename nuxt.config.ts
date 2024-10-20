// https://nuxt.com/docs/api/configuration/nuxt-config
import Components from 'unplugin-vue-components/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'

export default defineNuxtConfig({
  devtools: {
    enabled: true,
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
    viewer: true,
  },

  monacoEditor: {
    // These are default values:
    locale: 'en',
    componentName: {
      codeEditor: 'MonacoEditor',
      diffEditor: 'MonacoDiffEditor'
    }
  },

  modules: [//'nuxt-social-share',
  //'@nuxtjs/robots',
  //'device'
  '@nuxtjs/tailwindcss', 'nuxt-mdi', 'google-fonts', 'nuxt-monaco-editor', '@nuxtjs/color-mode', 'nuxtjs-naive-ui', '@nuxt/eslint'],

  compatibilityDate: '2024-10-12',
})