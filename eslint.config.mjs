// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
    // Ignore patterns - must come first
    {
        ignores: ['site/**', '**/site/**']
    },
    // Nuxt ESLint config with custom rules
    {
        files: ['**/*.ts', '**/*.tsx'],
        rules: {
            'no-console': 'off' // allow console.log in TypeScript files
        }
    }
)
