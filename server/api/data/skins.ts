import { getSkinsData } from '~/server/utils/csgoAPI';
import { APISkin } from "~/server/utils/interfaces";

interface QueryFilters {
    search?: string;        // Search term for name
    weapon?: string;        // Specific weapon type
    rarity?: string;       // Rarity filter
}

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const weapon = query.weapon as string;

    if (!weapon) {
        throw createError({
            statusCode: 400,
            message: 'Weapon is required'
        });
    }

    try {
        const skinData = getSkinsData();

        if (!skinData) {
            return {
                skins: [],
                meta: {
                    availableRarities: [],
                    availableWeapons: []
                }
            };
        }

        // Parse query parameters with proper type handling
        const filters: QueryFilters = {
            search: typeof query.search === 'string' ? query.search.toLowerCase() : undefined,
            weapon: weapon.toLowerCase(),
            rarity: typeof query.rarity === 'string' ? query.rarity : undefined,
        };

        // Get pagination parameters with safe defaults
        const page = Math.max(1, Number(query.page) || 1);
        const limit = Math.min(Math.max(1, Number(query.limit) || 50), 100); // Between 1 and 100, default 50

        // Apply filters
        let filteredSkins = skinData.filter((skin: APISkin) => {
            // Search term filter (checks name and description)
            if (filters.search &&
                !skin.name.toLowerCase().includes(filters.search) &&
                !skin.description?.toLowerCase().includes(filters.search)) {
                return false;
            }

            // Weapon type filter
            if (filters.weapon &&
                !skin.weapon?.id.toLowerCase().includes(filters.weapon)) {
                return false;
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
        const totalPages = Math.ceil(totalItems / limit);
        const currentPage = Math.min(page, totalPages);
        const offset = (currentPage - 1) * limit;

        // Apply pagination
        const paginatedSkins = filteredSkins.slice(offset, offset + limit);

        // Get unique values for metadata
        const availableRarities = Array.from(new Set(
            skinData
                .map(skin => skin.rarity?.name)
                .filter((name): name is string => !!name)
        ));

        const availableWeapons = Array.from(new Set(
            skinData
                .map(skin => skin.weapon?.name)
                .filter((name): name is string => !!name)
        ));

        // Return paginated results with metadata
        return {
            skins: paginatedSkins,
            pagination: {
                currentPage,
                totalPages,
                totalItems,
                limit
            },
            meta: {
                availableRarities,
                availableWeapons
            },
            appliedFilters: filters
        };

    } catch (error: any) {
        console.error('Error processing skins query:', error);
        throw createError({
            statusCode: 500,
            message: error.message || 'Failed to process skins query',
        });
    }
});