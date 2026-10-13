import { defineVitestConfig } from '@nuxt/test-utils/config'
import type { UserConfig } from 'vitest/config'

const config = defineVitestConfig({
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

// Vite matches aliases in order: ~/server must precede Nuxt's general ~ alias.
export default async () => {
  const resolved = await (config as () => Promise<UserConfig>)()
  for (const project of [resolved, ...(resolved.test?.projects ?? [])]) {
    if (!project || typeof project !== 'object') continue
    const target = project as Pick<UserConfig, 'resolve'>
    const aliases = target.resolve?.alias
    if (aliases && !Array.isArray(aliases)) {
      target.resolve!.alias = Object.fromEntries(
        Object.entries(aliases).sort(([a], [b]) => b.length - a.length)
      )
    }
  }
  return resolved
}
