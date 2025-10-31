import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
    test: {
        // Using 'nuxt' environment for access to Nuxt utilities and auto-imports
        // Note: This increases startup time vs 'happy-dom' but provides full Nuxt context
        // For pure unit tests without Nuxt dependencies, consider using 'happy-dom'
        environment: 'nuxt',
        environmentOptions: {
            nuxt: {
                mock: {
                    intersectionObserver: true,
                    indexedDb: true,
                }
            }
        }
    }
})
