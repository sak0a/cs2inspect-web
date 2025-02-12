import {validateSteamId, verifyUserAccess} from "~/server/utils/helpers";

const INSPECT_API_BASE_URL = process.env.INSPECT_API_ADDRESS || 'localhost:5000'
const INSPECT_API_KEY = process.env.INSPECT_API_KEY || ''

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const steamId = query.steamId as string
    const apiUrl = query.url as string

    validateSteamId(steamId)
    verifyUserAccess(event, steamId)

    if (!apiUrl) {
        throw createError({
            statusCode: 400,
            message: 'API-URL is required'
        })
    }

    const body = await readBody(event)

    if (!body) {
        throw createError({
            statusCode: 400,
            message: 'Invalid request body'
        })
    }


    try {
        if (apiUrl === 'create-link') {
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

            return {
                inspectUrl: createdLink,
            };
        } else if (apiUrl === 'analyze-link') {
            return analyzeInspectUrl(body.inspectUrl)
        } else if (apiUrl === 'decode-link') {
            const analyzeResult: InspectURLInfo | null = analyzeInspectUrl(body.inspectUrl)
            return decodeMaskedData(analyzeResult?.hex_data || '')
        }
    } catch (error) {
        console.error('Failed to create inspect link:', error)
        throw createError({
            statusCode: 500,
            message: 'Failed to create inspect link'
        })
    }
})