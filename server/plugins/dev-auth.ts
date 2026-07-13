import { isDevAuthEnabled } from '~/server/utils/devAuth'
import { Logger } from '~/server/utils/logger'

export default defineNitroPlugin(() => {
  if (isDevAuthEnabled()) {
    Logger.header('DEV AUTH ENABLED')
    Logger.info('Mock login is active. Do not use in production.', 'devAuth')
  }
})
