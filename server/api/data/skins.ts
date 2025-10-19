import { getSkinsData, getDataFreshness } from '~/server/utils/csgoAPI';
import type { APISkin } from "~/server/utils/interfaces";
import {
    createPaginatedResponse,
    createResponseMeta,
    createPaginationMeta,
    calculatePagination,
    extractFilterOptions,
    withErrorHandling
} from '~/server/utils/apiResponseHelpers';
import { isWeaponMatch } from '~/server/utils/weaponNameMapping';

interface QueryFilters {
    search?: string;        // Search term for name
    weapon?: string;        // Specific weapon type
    rarity?: string;       // Rarity filter
}

export default defineEventHandler(withErrorHandling(async (event) => {
    const startTime = Date.now();
    const query = getQuery(event);

    const weapon = query.weapon as string;
    validateRequiredRequestData(weapon, "Weapon");

    const skinData = getSkinsData();

    if (!skinData) {
        const meta = createResponseMeta(startTime, { weapon });
        return createPaginatedResponse(
            [],
            createPaginationMeta(1, 0, 50, 0),
            meta,
            { weapon },
            { rarities: [], weapons: [] }
        );
    }

    // Parse query parameters with proper type handling
    const filters: QueryFilters = {
        search: typeof query.search === 'string' ? query.search.toLowerCase() : undefined,
        weapon: weapon.toLowerCase(),
        rarity: typeof query.rarity === 'string' ? query.rarity : undefined,
    };

    // Get pagination parameters with safe defaults
    const { page, limit, offset } = calculatePagination(query, 50, 100);

    // Apply filters
    const filteredSkins = skinData.filter((skin: APISkin) => {
        // Search term filter (checks name and description)
        if (filters.search &&
            !skin.name.toLowerCase().includes(filters.search) &&
            !skin.description?.toLowerCase().includes(filters.search)) {
            return false;
        }

        // Weapon type filter using improved matching utility
        if (filters.weapon && skin.weapon?.id) {
            if (!isWeaponMatch(filters.weapon, skin.weapon.id)) {
                return false;
            }
        }

        // Rarity filter
        if (filters.rarity &&
            skin.rarity?.name.toLowerCase() !== filters.rarity.toLowerCase()) {
            return false;
        }

        return true;
    });

    // Calculate pagination values
    const totalItems = filteredSkins.length;
    const currentPage = Math.min(page, Math.ceil(totalItems / limit) || 1);
    const actualOffset = (currentPage - 1) * limit;

    // Apply pagination
    const paginatedSkins = filteredSkins.slice(actualOffset, actualOffset + limit);

    // Extract available filter options
    const availableFilters = extractFilterOptions(skinData, {
        rarities: 'rarity.name',
        weapons: 'weapon.name'
    });

    // Create response metadata with data freshness
    const dataFreshness = getDataFreshness();
    const meta = createResponseMeta(startTime, {
        weapon,
        filtersApplied: Object.keys(filters).filter(key => filters[key as keyof QueryFilters]),
        dataFreshness
    });

    // Create pagination metadata
    const pagination = createPaginationMeta(currentPage, totalItems, limit, paginatedSkins.length);

    // Return standardized paginated response
    return createPaginatedResponse(
        paginatedSkins,
        pagination,
        meta,
        filters,
        availableFilters,
        `Found ${totalItems} skins matching criteria`
    );
}, 'SKINS_FETCH_ERROR'));