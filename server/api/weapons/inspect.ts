import { verifyUserAccess, validateQueryParam } from "~/server/utils/helpers";
import {getCS2Client} from "~/server/plugins/init";
import { APIRequestLogger as Logger } from '~/server/utils/logger'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)

    Logger.header(`Inspect API request: ${event.method} ${event.req.url}`)

    const steamId = query.steamId as string
    validateQueryParam(steamId, 'Steam ID')
    verifyUserAccess(steamId, event)

    const apiUrl = query.url as string
    validateQueryParam(apiUrl, 'API-URL')

    const body = await readBody(event)
    validateQueryParam(body, 'Body')

    if (apiUrl === 'create-link') {
        Logger.info(`Creating inspect URL for ${steamId}`)
        const createdLink = createInspectUrl({
            defindex: body.defindex,
            paintindex: body.paintIndex,
            paintseed: body.pattern,
            paintwear: body.wear,
            rarity: body.rarity,
            killeaterscoretype: body.statTrak,
            killeatervalue: body.statTrakCount,
            customname: body.nametag,
            stickers: body.stickers,
            keychains: [body.keychain],
        })
        Logger.success(`Inspect URL created: ${createdLink}`)
        return { inspectUrl: createdLink };
    } else if (apiUrl === 'analyze-link') {
        Logger.success(`Analyzing inspect URL ${body.inspectUrl}`)
        return analyzeInspectUrl(body.inspectUrl)
    } else if (apiUrl === 'decode-link') {
        const analyzeResult: InspectURLInfo | null = analyzeInspectUrl(body.inspectUrl)
        Logger.info(`Decoding inspect URL ${body.inspectUrl}`)
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
                Logger.success('Fetched item info for inspect URL');
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