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

// Import types from centralized types directory
import type {
    InspectRequest,
    CreateUrlRequest,
    InspectUrlRequest,
    DecodeHexRequest,
    InspectAction,
    ItemType,
    ItemTypeConfig,
    ItemTypeConfigMap
} from '~/server/types';

// Item type configuration for different inspect behaviors
const ITEM_TYPE_CONFIG: ItemTypeConfigMap = {
    weapon: {
        defaultDefindex: WeaponType.AK_47,
        defaultPaintindex: WeaponPaint.AK_47_FIRE_SERPENT,
        defaultPaintseed: 661,
        defaultPaintwear: 0.15,
        defaultRarity: ItemRarity.COVERT,
        supportsStatTrak: true,
        supportsNameTag: true,
        supportsStickers: true,
        supportsKeychains: true
    },
    knife: {
        defaultDefindex: WeaponType.KARAMBIT,
        defaultPaintindex: WeaponPaint.KARAMBIT_DOPPLER,
        defaultPaintseed: 387,
        defaultPaintwear: 0.01,
        defaultRarity: ItemRarity.COVERT,
        supportsStatTrak: true,
        supportsNameTag: true,
        supportsStickers: false,
        supportsKeychains: false
    },
    glove: {
        defaultDefindex: WeaponType.AK_47, // Gloves use different defindex system
        defaultPaintindex: WeaponPaint.AK_47_FIRE_SERPENT,
        defaultPaintseed: 661,
        defaultPaintwear: 0.15,
        defaultRarity: ItemRarity.COVERT,
        supportsStatTrak: false,
        supportsNameTag: false,
        supportsStickers: false,
        supportsKeychains: false
    },
    agent: {
        defaultDefindex: WeaponType.AK_47, // Agents use different defindex system
        defaultPaintindex: WeaponPaint.AK_47_FIRE_SERPENT,
        defaultPaintseed: 661,
        defaultPaintwear: 0.15,
        defaultRarity: ItemRarity.COVERT,
        supportsStatTrak: false,
        supportsNameTag: false,
        supportsStickers: false,
        supportsKeychains: false
    },
    'music-kit': {
        defaultDefindex: WeaponType.AK_47, // Music kits use different defindex system
        defaultPaintindex: WeaponPaint.AK_47_FIRE_SERPENT,
        defaultPaintseed: 661,
        defaultPaintwear: 0.15,
        defaultRarity: ItemRarity.COVERT,
        supportsStatTrak: false,
        supportsNameTag: false,
        supportsStickers: false,
        supportsKeychains: false
    }
}

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const body = await readBody(event) as InspectRequest

    Logger.header(`Unified Inspect API request: ${event.method} ${event.req.url}`)

    const action = query.action as InspectAction
    validateRequiredRequestData(action, 'Action')

    const client: CS2Inspect = getCS2Client();

    // Determine item type from body or try to infer from context
    const itemType: ItemType = body.itemType || 'weapon' // Default to weapon for backward compatibility

    try {
        switch (action) {
            case 'create-url': {
                // Create an inspect URL for any item type with advanced customization support
                const config = ITEM_TYPE_CONFIG[itemType];
                const createUrlBody = body as CreateUrlRequest;

                let stickers = createUrlBody.stickers;
                let keychain = createUrlBody.keychain;

                // If we have a complete customization object (weapons), map it to the representation format
                if (createUrlBody.customization && config.supportsStickers) {
                    const representation = mapCustomizationToRepresentation(createUrlBody.customization);
                    stickers = representation.stickers;
                    keychain = representation.keychain;
                }

                const itemData: EconItem = {
                    defindex: createUrlBody.defindex || config.defaultDefindex,
                    paintindex: createUrlBody.paintindex || config.defaultPaintindex,
                    paintseed: createUrlBody.paintseed || config.defaultPaintseed,
                    paintwear: createUrlBody.paintwear || config.defaultPaintwear,
                    rarity: createUrlBody.rarity || config.defaultRarity,
                    killeaterscoretype: (config.supportsStatTrak && createUrlBody.statTrak) ? 1 : 0,
                    killeatervalue: (config.supportsStatTrak && createUrlBody.statTrakCount) || 0,
                    customname: (config.supportsNameTag && createUrlBody.nameTag) || '',
                    // Only include stickers and keychains for supported item types
                    ...(config.supportsStickers && {
                        stickers: stickers,
                        keychains: keychain ? [keychain] : undefined,
                    })
                };

                const inspectUrl = createInspectUrl(itemData);

                Logger.success(`Created ${itemType} inspect URL`)
                return {
                    success: true,
                    inspectUrl,
                    itemData,
                    itemType
                };
            }

            case 'analyze-url': {
                // Analyze URL structure using optimized static method (weapons only feature)
                const urlBody = body as InspectUrlRequest;
                validateRequiredRequestData(urlBody.inspectUrl, 'Inspect URL')

                try {
                    const analyzed = analyzeUrl(urlBody.inspectUrl);

                    Logger.success(`Analyzed inspect URL`)
                    return {
                        success: true,
                        analysis: analyzed,
                        requiresSteamClient: requiresSteamClient(urlBody.inspectUrl)
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
                const urlBody = body as InspectUrlRequest;
                validateRequiredRequestData(urlBody.inspectUrl, 'Inspect URL')

                // Use optimized static method to analyze URL
                const analyzed = analyzeUrl(urlBody.inspectUrl);

                if (analyzed.url_type === 'unmasked' && !client.isSteamClientReady()) {
                    throw createError({
                        statusCode: 503,
                        message: 'Steam client not connected - required for unmasked URLs'
                    });
                }

                // Use the universal inspectItem method that handles both types
                const itemInfo = await client.inspectItem(urlBody.inspectUrl);

                Logger.success(`Inspected ${analyzed.url_type} URL successfully`)
                return {
                    success: true,
                    urlType: analyzed.url_type,
                    item: itemInfo,
                    originalUrl: urlBody.inspectUrl,
                    ...(analyzed.url_type === 'unmasked' && {
                        queueStatus: {
                            length: client.getSteamClientStats().queueLength
                        }
                    })
                };
            }

            case 'decode-masked-only': {
                // Decode ONLY masked URLs (offline, no Steam client needed)
                const urlBody = body as InspectUrlRequest;
                validateRequiredRequestData(urlBody.inspectUrl, 'Inspect URL')

                try {
                    const decodedItem = client.decodeMaskedUrl(urlBody.inspectUrl);

                    Logger.success(`Decoded masked URL offline`)
                    return {
                        success: true,
                        urlType: 'masked',
                        item: decodedItem,
                        originalUrl: urlBody.inspectUrl,
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
                const hexBody = body as DecodeHexRequest;
                validateRequiredRequestData(hexBody.hexData, 'Hex Data')

                try {
                    // Use optimized static method - no instance creation needed
                    const decodedItem = decodeMaskedData(hexBody.hexData);

                    Logger.success(`Decoded hex data directly`)
                    return {
                        success: true,
                        item: decodedItem,
                        hexData: hexBody.hexData,
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
                // Validate an inspect URL with detailed analysis
                const urlBody = body as InspectUrlRequest;
                validateRequiredRequestData(urlBody.inspectUrl, 'Inspect URL')

                try {
                    // Use optimized static methods - no instance creation
                    const analyzed = analyzeUrl(urlBody.inspectUrl);
                    const validation = validateUrl(urlBody.inspectUrl);
                    const needsSteam = requiresSteamClient(urlBody.inspectUrl);

                    Logger.info(`URL validation result: valid ${analyzed.url_type} URL`)
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
                    const validation = validateUrl(urlBody.inspectUrl);

                    Logger.info(`URL validation result: invalid`)
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
        Logger.error(`Inspect API error: ${error.message}`)
        throw createError({
            statusCode: error.statusCode || 500,
            message: error.message || 'Internal server error'
        })
    }
})
