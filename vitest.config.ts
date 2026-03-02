import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    include: ['test/**/*.test.ts'],
    environmentOptions: {
      nuxt: {
        rootDir: process.cwd(),
        domEnvironment: 'happy-dom',
      },
    },
  },
})
