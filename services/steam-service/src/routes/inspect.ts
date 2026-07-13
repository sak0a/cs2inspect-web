import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import {
  createInspectUrl,
  analyzeUrl,
  decodeMaskedData,
  requiresSteamClient,
  validateUrl,
} from 'cs2-inspect-lib'
import type { EconItem, Sticker } from 'cs2-inspect-lib'
import { steamClientService } from '../services/steamClient.js'
import { requestQueue } from '../services/queue.js'
import { logger } from '../utils/logger.js'
import type {
  CreateUrlRequest,
  InspectItemRequest,
  DecodeHexRequest,
  ValidateUrlRequest,
  AnalyzeUrlRequest,
  ApiResponse,
} from '../types/index.js'

export async function inspectRoutes(fastify: FastifyInstance) {
  // Create Inspect URL
  fastify.post<{ Body: CreateUrlRequest }>(
    '/create-url',
    async (request: FastifyRequest<{ Body: CreateUrlRequest }>, reply: FastifyReply) => {
      try {
        const {
          itemType,
          defindex,
          paintindex,
          paintseed,
          paintwear,
          rarity,
          statTrak,
          statTrakCount,
          nameTag,
          stickers,
          keychain,
        } = request.body

        // Convert keychain to Sticker format if provided
        const keychains: Sticker[] | undefined = keychain
          ? [
              {
                slot: 0,
                sticker_id: keychain.defindex,
                offset_x: 0,
                offset_y: 0,
              } as Sticker,
            ]
          : undefined

        // Convert rarity to number if needed (EconItem expects number)
        const rarityValue =
          typeof rarity === 'number'
            ? rarity
            : typeof rarity === 'string'
              ? parseInt(rarity, 10) || 1
              : 1

        const itemData: EconItem = {
          defindex: defindex || 7, // Default to AK-47
          paintindex: paintindex || 0,
          paintseed: paintseed || 0,
          paintwear: paintwear || 0,
          rarity: rarityValue,
          killeaterscoretype: statTrak ? 1 : 0,
          killeatervalue: statTrakCount || 0,
          customname: nameTag || '',
          stickers: stickers,
          keychains: keychains,
        }

        const inspectUrl = createInspectUrl(itemData)

        logger.info(`Created ${itemType} inspect URL`)

        return {
          success: true,
          data: {
            inspectUrl,
            itemData,
            itemType,
          },
        }
      } catch (error) {
        logger.error('Error creating inspect URL:', error)
        reply.code(500)
        return {
          success: false,
          error: {
            code: 'CREATE_URL_ERROR',
            message: error instanceof Error ? error.message : 'Failed to create inspect URL',
          },
        }
      }
    }
  )

  // Inspect Item (requires Steam client)
  fastify.post<{ Body: InspectItemRequest }>(
    '/inspect-item',
    async (request: FastifyRequest<{ Body: InspectItemRequest }>, reply: FastifyReply) => {
      try {
        await steamClientService.ensureReady()

        const { inspectUrl, itemType } = request.body

        if (!inspectUrl) {
          reply.code(400)
          return {
            success: false,
            error: {
              code: 'INVALID_REQUEST',
              message: 'inspectUrl is required',
            },
          }
        }

        const client = steamClientService.getClient()
        const urlInfo = analyzeUrl(inspectUrl)

        if (!urlInfo) {
          reply.code(400)
          return {
            success: false,
            error: {
              code: 'INVALID_INSPECT_URL',
              message: 'Invalid inspect URL format',
            },
          }
        }

        // Queue the inspect request
        const itemData = await requestQueue.enqueue(async () => {
          if (urlInfo.url_type === 'masked' && urlInfo.hex_data) {
            // For masked URLs, decode directly
            return decodeMaskedData(urlInfo.hex_data)
          } else if (urlInfo.url_type === 'unmasked' && requiresSteamClient(inspectUrl)) {
            // For unmasked URLs, use Steam client - pass the original URL string
            return await client.inspectItem(inspectUrl)
          } else {
            throw new Error('Unable to process inspect URL')
          }
        })

        logger.info(`Inspected ${itemType || 'item'} successfully`)

        return {
          success: true,
          data: itemData,
        }
      } catch (error) {
        logger.error('Error inspecting item:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'

        let code = 'INSPECT_ERROR'
        if (errorMessage.includes('not ready') || errorMessage.includes('not initialized')) {
          code = 'STEAM_CLIENT_UNAVAILABLE'
        } else if (errorMessage.includes('timeout')) {
          code = 'REQUEST_TIMEOUT'
        }

        reply.code(500)
        return {
          success: false,
          error: {
            code,
            message: errorMessage,
          },
        }
      }
    }
  )

  // Decode Masked URL Only (no Steam client needed)
  fastify.post<{ Body: InspectItemRequest }>(
    '/decode-masked-only',
    async (request: FastifyRequest<{ Body: InspectItemRequest }>, reply: FastifyReply) => {
      try {
        const { inspectUrl } = request.body

        if (!inspectUrl) {
          reply.code(400)
          return {
            success: false,
            error: {
              code: 'INVALID_REQUEST',
              message: 'inspectUrl is required',
            },
          }
        }

        const urlInfo = analyzeUrl(inspectUrl)

        if (!urlInfo || urlInfo.url_type !== 'masked' || !urlInfo.hex_data) {
          reply.code(400)
          return {
            success: false,
            error: {
              code: 'INVALID_MASKED_URL',
              message: 'URL is not a masked inspect URL',
            },
          }
        }

        const itemData = decodeMaskedData(urlInfo.hex_data)

        logger.info('Decoded masked URL successfully')

        return {
          success: true,
          data: itemData,
        }
      } catch (error) {
        logger.error('Error decoding masked URL:', error)
        reply.code(500)
        return {
          success: false,
          error: {
            code: 'DECODE_ERROR',
            message: error instanceof Error ? error.message : 'Failed to decode masked URL',
          },
        }
      }
    }
  )

  // Decode Hex Data
  fastify.post<{ Body: DecodeHexRequest }>(
    '/decode-hex-data',
    async (request: FastifyRequest<{ Body: DecodeHexRequest }>, reply: FastifyReply) => {
      try {
        const { hexData } = request.body

        if (!hexData) {
          reply.code(400)
          return {
            success: false,
            error: {
              code: 'INVALID_REQUEST',
              message: 'hexData is required',
            },
          }
        }

        const itemData = decodeMaskedData(hexData)

        logger.info('Decoded hex data successfully')

        return {
          success: true,
          data: itemData,
        }
      } catch (error) {
        logger.error('Error decoding hex data:', error)
        reply.code(500)
        return {
          success: false,
          error: {
            code: 'DECODE_ERROR',
            message: error instanceof Error ? error.message : 'Failed to decode hex data',
          },
        }
      }
    }
  )

  // Validate URL
  fastify.post<{ Body: ValidateUrlRequest }>(
    '/validate-url',
    async (request: FastifyRequest<{ Body: ValidateUrlRequest }>, reply: FastifyReply) => {
      try {
        const { inspectUrl } = request.body

        if (!inspectUrl) {
          reply.code(400)
          return {
            success: false,
            error: {
              code: 'INVALID_REQUEST',
              message: 'inspectUrl is required',
            },
          }
        }

        const validationResult = validateUrl(inspectUrl)
        const urlInfo = analyzeUrl(inspectUrl)

        // validateUrl returns a ValidationResult object, extract the valid property
        const isValid =
          typeof validationResult === 'object' &&
          validationResult !== null &&
          'valid' in validationResult
            ? (validationResult as { valid: boolean }).valid
            : Boolean(validationResult)

        logger.info(`Validated URL: ${isValid ? 'valid' : 'invalid'}`)

        return {
          success: true,
          data: {
            valid: isValid,
            urlInfo: urlInfo || null,
            validation: validationResult,
          },
        }
      } catch (error) {
        logger.error('Error validating URL:', error)
        reply.code(500)
        return {
          success: false,
          error: {
            code: 'VALIDATE_ERROR',
            message: error instanceof Error ? error.message : 'Failed to validate URL',
          },
        }
      }
    }
  )

  // Analyze URL
  fastify.post<{ Body: AnalyzeUrlRequest }>(
    '/analyze-url',
    async (request: FastifyRequest<{ Body: AnalyzeUrlRequest }>, reply: FastifyReply) => {
      try {
        const { inspectUrl } = request.body

        if (!inspectUrl) {
          reply.code(400)
          return {
            success: false,
            error: {
              code: 'INVALID_REQUEST',
              message: 'inspectUrl is required',
            },
          }
        }

        const urlInfo = analyzeUrl(inspectUrl)

        if (!urlInfo) {
          reply.code(400)
          return {
            success: false,
            error: {
              code: 'INVALID_URL_FORMAT',
              message: 'Unable to analyze URL format',
            },
          }
        }

        logger.info('Analyzed URL successfully')

        return {
          success: true,
          data: urlInfo,
        }
      } catch (error) {
        logger.error('Error analyzing URL:', error)
        reply.code(500)
        return {
          success: false,
          error: {
            code: 'ANALYZE_ERROR',
            message: error instanceof Error ? error.message : 'Failed to analyze URL',
          },
        }
      }
    }
  )
}
