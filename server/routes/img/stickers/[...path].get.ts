import { createReadStream, statSync, existsSync } from 'fs'
import { join, extname } from 'path'
import { sendStream, setHeader, createError } from 'h3'

export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, 'path')
  
  if (!path) {
    throw createError({ statusCode: 400, message: 'Path is required' })
  }

  // Sanitize path to prevent directory traversal
  const sanitizedPath = path.replace(/\.\./g, '')
  const filePath = join(process.cwd(), 'storage', 'stickers', sanitizedPath)

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
      '.jpeg': 'image/jpeg'
    }
    
    const contentType = contentTypes[ext] || 'application/octet-stream'
    
    setHeader(event, 'Content-Type', contentType)
    setHeader(event, 'Content-Length', stat.size)
    setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
    
    const stream = createReadStream(filePath)
    return sendStream(event, stream)
  } catch (err) {
    console.error('Error serving sticker:', err)
    throw createError({ statusCode: 500, message: 'Error serving sticker' })
  }
})
