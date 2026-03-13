import { createReadStream, statSync, existsSync } from 'fs'
import { resolve, extname } from 'path'
import { sendStream, setHeader, createError } from 'h3'
import { Logger } from '~/server/utils/logger'

export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, 'path')

  if (!path) {
    throw createError({ statusCode: 400, message: 'Path is required' })
  }

  // Sanitize path to prevent directory traversal
  const sanitizedPath = path.replace(/\.\./g, '')
  const baseDir = resolve(process.cwd(), 'storage', 'stickers')
  const filePath = resolve(baseDir, sanitizedPath)

  // Jail check: ensure resolved path stays within the stickers directory
  if (!filePath.startsWith(baseDir + '/') && filePath !== baseDir) {
    throw createError({ statusCode: 403, message: 'Access denied' })
  }

  if (!existsSync(filePath)) {
    throw createError({ statusCode: 404, message: 'Sticker not found' })
  }

  try {
    const stat = statSync(filePath)

    // Get content type based on extension
    const ext = extname(filePath).toLowerCase()
    const contentTypes: Record<string, string> = {
      '.webp': 'image/webp',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
    }

    const contentType = contentTypes[ext] || 'application/octet-stream'

    setHeader(event, 'Content-Type', contentType)
    setHeader(event, 'Content-Length', stat.size)
    setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')

    const stream = createReadStream(filePath)
    return sendStream(event, stream)
  } catch (err) {
    Logger.error(
      `Error serving sticker: ${err instanceof Error ? err.message : String(err)}`,
      'stickers'
    )
    throw createError({ statusCode: 500, message: 'Error serving sticker' })
  }
})
