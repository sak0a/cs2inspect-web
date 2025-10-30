// filepath: /server/api/health/proxy.ts
import { defineEventHandler } from 'h3'
import { checkImageProxy } from '~/server/utils/health/probes'
import type { HealthCheckResult } from '~/server/types/health'

export default defineEventHandler(async (): Promise<HealthCheckResult> => {
  const result = await checkImageProxy()
  return result
})

