/**
 * Generic function to filter API data based on query parameters
 * @param data Array of data items to filter
 * @param query Query parameters from the request
 * @returns Filtered array of data items
 */
export function filterDataByQuery<T extends object>(data: T[], query: Record<string, string>): T[] {
    if (!data || !Array.isArray(data)) {
        return [];
    }

    return data.filter((item: T) => {
        return Object.keys(query).every((key) => {
            // Check if the item has the property and if it matches the query
            if (key in item) {
                const queryValue = query[key]; // Already cast to string in the event handler
                const itemValue = (item as Record<string, unknown>)[key];

                // Handle nested objects (like rarity, team, etc.)
                if (typeof itemValue === 'object' && itemValue !== null) {
                    const nestedValue = itemValue as Record<string, unknown>;
                    return nestedValue.id === queryValue ||
                        nestedValue.name === queryValue ||
                        (nestedValue.color && nestedValue.color === queryValue);
                }

                // For other fields, perform a direct comparison
                return itemValue === queryValue;
            }
            return true; // If the key doesn't exist in the item, ignore it
        });
    });
}

/**
 * Creates a data API handler for a specific data type
 * @param getDataFn Function to get the data (can be sync or async)
 * @returns Event handler function
 */
export function createDataApiHandler<T extends object>(
    getDataFn: (() => T[]) | (() => Promise<T[]>)
) {
    return defineEventHandler(async (event) => {
        const startTime = Date.now();
        const query = getQuery(event);

        // Support both sync and async data getters
        const dataResult = getDataFn();
        const data = dataResult instanceof Promise ? await dataResult : dataResult;

        // Convert query to Record<string, string> and remove undefined values
        const cleanQuery: Record<string, string> = {};
        Object.entries(query).forEach(([key, value]) => {
            if (value !== undefined && typeof value === 'string') {
                cleanQuery[key] = value;
            }
        });

        const filteredData = filterDataByQuery(data, cleanQuery);

        return {
            success: true,
            data: filteredData,
            meta: {
                timestamp: new Date().toISOString(),
                apiVersion: '1.0.0',
                processingTime: Date.now() - startTime,
                totalItems: filteredData.length,
                filtersApplied: Object.keys(cleanQuery)
            }
        };
    });
}
