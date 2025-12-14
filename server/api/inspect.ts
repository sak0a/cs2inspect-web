import { getCS2Client } from "~/server/plugins/init";
import { steamServiceClient } from '~/server/utils/steamServiceClient';
import { APIRequestLogger as Logger } from '~/server/utils/logger'
import { mapCustomizationToRepresentation } from '~/server/utils/inspectHelpers'
import { validateRequiredRequestData } from '~/server/utils/helpers'
import { defineEventHandler, createError, getQuery, readBody } from 'h3'
import type {
    EconItem,
    CS2Inspect
} from "cs2-inspect-lib";
import {
    WeaponType,
    WeaponPaint,
    ItemRarity,
    // Optimized static methods
    analyzeUrl,
    decodeMaskedData,
    createInspectUrl,
    requiresSteamClient,
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

// Check if steam service is enabled
const USE_STEAM_SERVICE = !!process.env.STEAM_SERVICE_URL && !!process.env.STEAM_SERVICE_API_KEY;

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const body = await readBody(event) as InspectRequest

    Logger.header(`Unified Inspect API request: ${event.method} ${event.req.url}`)

    const action = query.action as InspectAction
    validateRequiredRequestData(action, 'Action')

    // Use steam service if configured, otherwise fall back to local client
    const useService = USE_STEAM_SERVICE;
    const client: CS2Inspect | null = useService ? null : getCS2Client();

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

                if (useService) {
                    const response = await steamServiceClient.analyzeUrl({
                        inspectUrl: urlBody.inspectUrl,
                    });

                    if (!response.success) {
                        throw createError({
                            statusCode: 400,
                            message: response.error?.message || 'Failed to analyze URL'
                        });
                    }

                    Logger.success(`Analyzed inspect URL via service`)
                    return {
                        success: true,
                        analysis: response.data,
                        requiresSteamClient: requiresSteamClient(urlBody.inspectUrl)
                    };
                } else {
                    try {
                        const analyzed = analyzeUrl(urlBody.inspectUrl);

                        Logger.success(`Analyzed inspect URL`)
                        return {
                            success: true,
                            analysis: analyzed,
                            requiresSteamClient: requiresSteamClient(urlBody.inspectUrl)
                        };
                    } catch (error: unknown) {
                        const errorMessage = error instanceof Error ? error.message : 'Invalid inspect URL'
                        throw createError({
                            statusCode: 400,
                            message: `Invalid inspect URL: ${errorMessage}`
                        });
                    }
                }
            }

            case 'inspect-item': {
                // Inspect any URL (masked or unmasked) - Universal method
                const urlBody = body as InspectUrlRequest;
                validateRequiredRequestData(urlBody.inspectUrl, 'Inspect URL')

                // Use optimized static method to analyze URL
                const analyzed = analyzeUrl(urlBody.inspectUrl);

                if (useService) {
                    // Use steam service
                    const response = await steamServiceClient.inspectItem({
                        inspectUrl: urlBody.inspectUrl,
                        itemType: body.itemType,
                    });

                    if (!response.success) {
                        throw createError({
                            statusCode: response.error?.code === 'STEAM_CLIENT_UNAVAILABLE' ? 503 : 500,
                            message: response.error?.message || 'Failed to inspect item'
                        });
                    }

                    Logger.success(`Inspected ${analyzed.url_type} URL successfully via service`)
                    return {
                        success: true,
                        urlType: analyzed.url_type,
                        item: response.data,
                        originalUrl: urlBody.inspectUrl,
                    };
                } else {
                    // Use local client
                    if (analyzed.url_type === 'unmasked' && !client!.isSteamClientReady()) {
                        throw createError({
                            statusCode: 503,
                            message: 'Steam client not connected - required for unmasked URLs'
                        });
                    }

                    const itemInfo = await client!.inspectItem(urlBody.inspectUrl);

                    Logger.success(`Inspected ${analyzed.url_type} URL successfully`)
                    return {
                        success: true,
                        urlType: analyzed.url_type,
                        item: itemInfo,
                        originalUrl: urlBody.inspectUrl,
                        ...(analyzed.url_type === 'unmasked' && {
                            queueStatus: {
                                length: client!.getSteamClientStats().queueLength
                            }
                        })
                    };
                }
            }

            case 'decode-masked-only': {
                // Decode ONLY masked URLs (offline, no Steam client needed)
                const urlBody = body as InspectUrlRequest;
                validateRequiredRequestData(urlBody.inspectUrl, 'Inspect URL')

                if (useService) {
                    const response = await steamServiceClient.decodeMaskedOnly({
                        inspectUrl: urlBody.inspectUrl,
                        itemType: body.itemType,
                    });

                    if (!response.success) {
                        throw createError({
                            statusCode: 400,
                            message: response.error?.message || 'Failed to decode masked URL'
                        });
                    }

                    Logger.success(`Decoded masked URL offline via service`)
                    return {
                        success: true,
                        urlType: 'masked',
                        item: response.data,
                        originalUrl: urlBody.inspectUrl,
                        method: 'offline-decode'
                    };
                } else {
                    try {
                        const decodedItem = client!.decodeMaskedUrl(urlBody.inspectUrl);

                        Logger.success(`Decoded masked URL offline`)
                        return {
                            success: true,
                            urlType: 'masked',
                            item: decodedItem,
                            originalUrl: urlBody.inspectUrl,
                            method: 'offline-decode'
                        };
                    } catch (error: unknown) {
                        if (error instanceof Error && error.message.includes('unmasked URL')) {
                            throw createError({
                                statusCode: 400,
                                message: 'This URL is unmasked (market/inventory link). Use inspect-item action instead.'
                            });
                        }
                        throw error;
                    }
                }
            }

            case 'decode-hex-data': {
                // Decode raw hex data directly (fastest method)
                const hexBody = body as DecodeHexRequest;
                validateRequiredRequestData(hexBody.hexData, 'Hex Data')

                if (useService) {
                    const response = await steamServiceClient.decodeHexData({
                        hexData: hexBody.hexData,
                    });

                    if (!response.success) {
                        throw createError({
                            statusCode: 400,
                            message: response.error?.message || 'Failed to decode hex data'
                        });
                    }

                    Logger.success(`Decoded hex data directly via service`)
                    return {
                        success: true,
                        item: response.data,
                        hexData: hexBody.hexData,
                        method: 'direct-protobuf-decode'
                    };
                } else {
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
                    } catch (error: unknown) {
                        const errorMessage = error instanceof Error ? error.message : 'Invalid hex data'
                        throw createError({
                            statusCode: 400,
                            message: `Invalid hex data: ${errorMessage}`
                        });
                    }
                }
            }

            case 'validate-url': {
                // Validate an inspect URL with detailed analysis
                const urlBody = body as InspectUrlRequest;
                validateRequiredRequestData(urlBody.inspectUrl, 'Inspect URL')

                if (useService) {
                    const response = await steamServiceClient.validateUrl({
                        inspectUrl: urlBody.inspectUrl,
                    });

                    if (!response.success) {
                        throw createError({
                            statusCode: 400,
                            message: response.error?.message || 'Failed to validate URL'
                        });
                    }

                    Logger.info(`URL validation result via service: ${response.data?.valid ? 'valid' : 'invalid'}`)
                    return {
                        success: true,
                        isValid: response.data?.valid || false,
                        urlType: response.data?.urlInfo ? (response.data.urlInfo as { url_type?: string }).url_type : null,
                        requiresSteamClient: requiresSteamClient(urlBody.inspectUrl),
                        validation: response.data?.urlInfo,
                    };
                } else {
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
                    } catch (error: unknown) {
                        const validation = validateUrl(urlBody.inspectUrl);
                        const errorMessage = error instanceof Error ? error.message : 'Invalid URL'

                        Logger.info(`URL validation result: invalid`)
                        return {
                            success: true,
                            isValid: false,
                            urlType: null,
                            requiresSteamClient: false,
                            validation: validation,
                            error: errorMessage
                        };
                    }
                }
            }

            case 'client-status': {
                // Get Steam client status
                if (useService) {
                    const response = await steamServiceClient.getStatus();
                    if (!response.success) {
                        throw createError({
                            statusCode: 500,
                            message: response.error?.message || 'Failed to get service status'
                        });
                    }

                    Logger.info(`Steam service status: ${response.data?.steamClient.available ? 'Ready' : 'Not Ready'}`)
                    return {
                        success: true,
                        steamClient: {
                            isReady: response.data?.steamClient.available || false,
                            status: response.data?.steamClient.status || 'unknown',
                            queueLength: response.data?.queue.pending || 0,
                            unmaskedSupport: response.data?.steamClient.available || false
                        },
                        service: response.data
                    };
                } else {
                    const stats = client!.getSteamClientStats();

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
            }

            default:
                throw createError({
                    statusCode: 400,
                    message: `Unknown action: ${action}. Available actions: create-url, analyze-url, inspect-item, decode-masked-only, decode-hex-data, validate-url, client-status`
                });
        }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Inspect API error'
        const statusCode = (error && typeof error === 'object' && 'statusCode' in error && typeof error.statusCode === 'number') ? error.statusCode : 500
        Logger.error(`Inspect API error: ${errorMessage}`)
        throw createError({
            statusCode,
            message: errorMessage || 'Internal server error'
        })
    }
})
