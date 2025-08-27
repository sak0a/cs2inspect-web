import { getCS2Client } from "~/server/plugins/init";
import { APIRequestLogger as Logger } from '~/server/utils/logger'
import { mapCustomizationToRepresentation } from '~/server/utils/inspectHelpers'
import { validateRequiredRequestData } from '~/server/utils/helpers'
import { defineEventHandler, createError, getQuery, readBody } from 'h3'
import {
    EconItem,
    WeaponType,
    WeaponPaint,
    ItemRarity,
    CS2Inspect,
    // Optimized static methods
    analyzeUrl,
    decodeMaskedData,
    createInspectUrl,
    requiresSteamClient,
    isValidUrl,
    validateUrl
} from "cs2-inspect-lib";

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const body = await readBody(event)

    Logger.header(`Weapon Inspect API request: ${event.method} ${event.req.url}`)

    const action = query.action as string
    validateRequiredRequestData(action, 'Action')

    const client: CS2Inspect = getCS2Client();

    try {
        switch (action) {
            case 'create-url': {
                // Create an inspect URL for a weapon with advanced customization support
                let stickers = body.stickers;
                let keychain = body.keychain;

                // If we have a complete customization object, map it to the representation format
                if (body.customization) {
                    const representation = mapCustomizationToRepresentation(body.customization);
                    stickers = representation.stickers;
                    keychain = representation.keychain;
                }

                const itemData: EconItem = {
                    defindex: body.defindex || WeaponType.AK_47,
                    paintindex: body.paintindex || WeaponPaint.AK_47_FIRE_SERPENT,
                    paintseed: body.paintseed || 661,
                    paintwear: body.paintwear || 0.15,
                    rarity: body.rarity || ItemRarity.COVERT,
                    killeaterscoretype: body.statTrak ? 1 : 0,
                    killeatervalue: body.statTrakCount || 0,
                    customname: body.nameTag || '',
                    stickers: stickers,
                    keychains: keychain ? [keychain] : undefined,
                };

                const inspectUrl = createInspectUrl(itemData);

                Logger.success(`Created weapon inspect URL`)
                return {
                    success: true,
                    inspectUrl,
                    itemData
                };
            }

            case 'analyze-url': {
                // Analyze URL structure using optimized static method
                const inspectUrl = body.inspectUrl as string
                validateRequiredRequestData(inspectUrl, 'Inspect URL')

                try {
                    const analyzed = analyzeUrl(inspectUrl);

                    Logger.success(`Analyzed weapon inspect URL`)
                    return {
                        success: true,
                        analysis: analyzed,
                        requiresSteamClient: requiresSteamClient(inspectUrl)
                    };
                } catch (error: any) {
                    throw createError({
                        statusCode: 400,
                        message: `Invalid inspect URL: ${error.message}`
                    });
                }
            }

            case 'inspect-item': {
                // Inspect any URL (masked or unmasked) - Universal method
                const inspectUrl = body.inspectUrl as string
                validateRequiredRequestData(inspectUrl, 'Inspect URL')

                // Use optimized static method to analyze URL
                const analyzed = client.analyzeUrl(inspectUrl);

                if (analyzed.url_type === 'unmasked' && !client.isSteamClientReady()) {
                    throw createError({
                        statusCode: 503,
                        message: 'Steam client not connected - required for unmasked URLs'
                    });
                }

                // Use the universal inspectItem method
                const itemInfo = await client.inspectItem(inspectUrl);

                Logger.success(`Inspected ${analyzed.url_type} weapon URL successfully`)
                return {
                    success: true,
                    urlType: analyzed.url_type,
                    item: itemInfo,
                    originalUrl: inspectUrl,
                    ...(analyzed.url_type === 'unmasked' && {
                        queueStatus: {
                            length: client.getSteamClientStats().queueLength
                        }
                    })
                };
            }

            case 'decode-masked-only': {
                // Decode ONLY masked URLs (offline, no Steam client needed)
                const inspectUrl = body.inspectUrl as string
                validateRequiredRequestData(inspectUrl, 'Inspect URL')

                try {
                    const decodedItem = client.decodeMaskedUrl(inspectUrl);

                    Logger.success(`Decoded masked weapon URL offline`)
                    return {
                        success: true,
                        urlType: 'masked',
                        item: decodedItem,
                        originalUrl: inspectUrl,
                        method: 'offline-decode'
                    };
                } catch (error: any) {
                    if (error.message.includes('unmasked URL')) {
                        throw createError({
                            statusCode: 400,
                            message: 'This URL is unmasked (market/inventory link). Use inspect-item action instead.'
                        });
                    }
                    throw error;
                }
            }

            case 'decode-hex-data': {
                // Decode raw hex data directly (fastest method)
                const hexData = body.hexData as string
                validateRequiredRequestData(hexData, 'Hex Data')

                try {
                    // Use optimized static method - no instance creation needed
                    const decodedItem = decodeMaskedData(hexData);

                    Logger.success(`Decoded weapon hex data directly`)
                    return {
                        success: true,
                        item: decodedItem,
                        hexData: hexData,
                        method: 'direct-protobuf-decode'
                    };
                } catch (error: any) {
                    throw createError({
                        statusCode: 400,
                        message: `Invalid hex data: ${error.message}`
                    });
                }
            }

            case 'validate-url': {
                // Validate a weapon inspect URL with detailed analysis
                const inspectUrl = body.inspectUrl as string
                validateRequiredRequestData(inspectUrl, 'Inspect URL')

                try {
                    // Use optimized static methods - no instance creation
                    const analyzed = analyzeUrl(inspectUrl);
                    const validation = validateUrl(inspectUrl);
                    const needsSteam = requiresSteamClient(inspectUrl);

                    Logger.info(`URL validation result: valid ${analyzed.url_type} weapon URL`)
                    return {
                        success: true,
                        isValid: true,
                        urlType: analyzed.url_type,
                        requiresSteamClient: needsSteam,
                        validation: validation,
                        urlInfo: {
                            isQuoted: analyzed.is_quoted,
                            hasHexData: !!analyzed.hex_data,
                            hexDataLength: analyzed.hex_data?.length || 0
                        }
                    };
                } catch (error: any) {
                    const validation = validateUrl(inspectUrl);

                    Logger.info(`URL validation result: invalid weapon URL`)
                    return {
                        success: true,
                        isValid: false,
                        urlType: null,
                        requiresSteamClient: false,
                        validation: validation,
                        error: error.message
                    };
                }
            }

            case 'client-status': {
                // Get Steam client status
                const stats = client.getSteamClientStats();

                Logger.info(`Steam client status: ${stats.isAvailable ? 'Ready' : 'Not Ready'}`)
                return {
                    success: true,
                    steamClient: {
                        isReady: stats.isAvailable,
                        status: stats.status,
                        queueLength: stats.queueLength,
                        unmaskedSupport: stats.unmaskedSupport
                    }
                };
            }

            default:
                throw createError({
                    statusCode: 400,
                    message: `Unknown action: ${action}. Available actions: create-url, analyze-url, inspect-item, decode-masked-only, decode-hex-data, validate-url, client-status`
                });
        }

    } catch (error: any) {
        Logger.error(`Weapon API Error: ${error.message}`)

        // Handle specific library error types
        if (error.message.includes('Steam client is not available') ||
            error.message.includes('Steam client not connected')) {
            throw createError({
                statusCode: 503,
                message: 'Steam client not connected'
            });
        }

        if (error.message.includes('queue is full') ||
            error.message.includes('Inspection queue is full')) {
            throw createError({
                statusCode: 429,
                message: 'Inspection queue is full, please try again later'
            });
        }

        if (error.message.includes('timeout') ||
            error.message.includes('timed out')) {
            throw createError({
                statusCode: 504,
                message: 'Request timed out'
            });
        }

        if (error.message.includes('Unmasked URLs require Steam client support')) {
            throw createError({
                statusCode: 503,
                message: 'Steam client required for this URL type'
            });
        }

        if (error.message.includes('Invalid URL format') ||
            error.message.includes('Invalid inspect URL')) {
            throw createError({
                statusCode: 400,
                message: 'Invalid inspect URL format'
            });
        }

        // Generic error handling
        throw createError({
            statusCode: 500,
            message: error.message || 'Internal server error'
        });
    }
})