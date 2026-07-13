// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'
import eslintConfigPrettier from 'eslint-config-prettier'

export default withNuxt(
  // Ignore patterns - must come first
  {
    ignores: ['site/**', '**/site/**', 'services/**', 'app/components/sui/**'],
  },
  // Nuxt ESLint config with custom rules
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      'no-console': 'off', // allow console.log in TypeScript files
      'no-useless-assignment': 'off', // ESLint 10: too noisy for try/catch init patterns
    },
  },
  // Disable ESLint rules that conflict with Prettier
  eslintConfigPrettier
)
