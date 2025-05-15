import { getCS2Client } from "~/server/plugins/init";
import { APIRequestLogger as Logger } from '~/server/utils/logger'
import { validateRequiredRequestData } from '~/server/utils/helpers'
import { defineEventHandler, createError } from 'h3'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)

    Logger.header(`Glove Inspect API request: ${event.method} ${event.req.url}`)

    const steamId = query.steamId as string
    validateRequiredRequestData(steamId, 'Steam ID')

    const apiUrl = query.url as string
    validateRequiredRequestData(apiUrl, 'API-URL')

    const body = await readBody(event)
    validateRequiredRequestData(body, 'Body')

    if (apiUrl === 'create-link') {
        // Create an inspect link for gloves
        const createdLink = createInspectUrl({
            defindex: body.defindex,
            paintindex: body.paintIndex,
            paintseed: body.pattern,
            paintwear: body.wear,
            rarity: body.rarity,
            // Gloves don't have StatTrak or nametags
        } as ItemBuilder)

        Logger.success(`Glove Inspect URL created: ${createdLink}`)
        return { inspectUrl: createdLink };

    } else if (apiUrl === 'decode-link') {
        const analyzeResult: InspectURLInfo | null = analyzeInspectUrl(body.inspectUrl)
        Logger.info(`Decoding glove inspect URL ${body.inspectUrl}`)
        if (!analyzeResult) {
            Logger.error('Invalid inspect URL')
            throw createError({
                statusCode: 400,
                message: 'Invalid inspect URL'
            });
        }

        if (analyzeResult?.url_type === 'masked') {
            Logger.info('Inspect URL is masked')
            return decodeMaskedData(analyzeResult.hex_data || '');
        }

        if (analyzeResult?.url_type === 'unmasked') {
            Logger.info('Inspect URL is unmasked')
            try {
                const client = getCS2Client();

                if (!client.getIsReady()) {
                    Logger.error('CS2 client not connected')
                    throw createError({
                        statusCode: 503,
                        message: 'CS2 client not connected'
                    });
                }

                const itemInfo = await client.inspectItem(analyzeResult);
                Logger.success('Fetched glove info for inspect URL');
                return {
                    ...itemInfo,
                    inspectUrl: body.inspectUrl,
                    queueStatus: {
                        length: client.getQueueLength()
                    }
                };
            } catch (error: any) {
                Logger.error(error.message)
                if (error.message === 'CS2 client not connected') {
                    throw createError({
                        statusCode: 503,
                        message: error.message
                    });
                }

                if (error.message === 'Inspection queue is full') {
                    throw createError({
                        statusCode: 429,
                        message: error.message
                    });
                }

                if (error.message === 'Steam API request timed out after 10 seconds') {
                    throw createError({
                        statusCode: 504,
                        message: error.message
                    });
                }

                throw createError({
                    statusCode: 503,
                    message: error.message
                });
            }
        }
    }
})
