import { getCS2Client } from "~/server/plugins/init";
import { APIRequestLogger as Logger } from '~/server/utils/logger'
import { mapCustomizationToRepresentation } from '~/server/utils/inspectHelpers'
import { validateRequiredRequestData } from '~/server/utils/helpers'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)

    Logger.header(`Inspect API request: ${event.method} ${event.req.url}`)

    const steamId = query.steamId as string
    validateRequiredRequestData(steamId, 'Steam ID')

    const apiUrl = query.url as string
    validateRequiredRequestData(apiUrl, 'API-URL')

    const body = await readBody(event)
    validateRequiredRequestData(body, 'Body')

    if (apiUrl === 'create-link') {
        // Map the customization data if it's a weapon with stickers/keychain
        let stickers = body.stickers;
        let keychain = body.keychain;

        // If we have a complete customization object, map it to the representation format
        if (body.customization) {
            const representation = mapCustomizationToRepresentation(body.customization);
            stickers = representation.stickers;
            keychain = representation.keychain;
        }

        const createdLink = createInspectUrl({
            defindex: body.defindex,
            paintindex: body.paintIndex,
            paintseed: body.pattern,
            paintwear: body.wear,
            rarity: body.rarity,
            killeaterscoretype: body.statTrak ? 1 : 0,
            killeatervalue: body.statTrakCount,
            customname: body.nameTag,
            stickers: stickers,
            keychains: keychain ? [keychain] : undefined,
        } as ItemBuilder)

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