/**
 * Generic function to filter API data based on query parameters
 * @param data Array of data items to filter
 * @param query Query parameters from the request
 * @returns Filtered array of data items
 */
export function filterDataByQuery<T>(data: T[], query: Record<string, string>): T[] {
    if (!data || !Array.isArray(data)) {
        return [];
    }
    
    return data.filter((item: any) => {
        return Object.keys(query).every((key) => {
            // Check if the item has the property and if it matches the query
            if (key in item) {
                const queryValue = query[key]; // Already cast to string in the event handler
                const itemValue = item[key];

                // Handle nested objects (like rarity, team, etc.)
                if (typeof itemValue === 'object' && itemValue !== null) {
                    return itemValue.id === queryValue || 
                           itemValue.name === queryValue || 
                           (itemValue.color && itemValue.color === queryValue);
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
 * @param getDataFn Function to get the data
 * @param responseKey Key to use in the response object
 * @returns Event handler function
 */
export function createDataApiHandler<T>(
    getDataFn: () => T[], 
    responseKey: string
) {
    return defineEventHandler(async (event) => {
        const query = getQuery(event);
        const data = getDataFn();
        
        // Convert query to Record<string, string> and remove undefined values
        const cleanQuery: Record<string, string> = {};
        Object.entries(query).forEach(([key, value]) => {
            if (value !== undefined && typeof value === 'string') {
                cleanQuery[key] = value;
            }
        });
        
        const filteredData = filterDataByQuery(data, cleanQuery);
        
        return { [responseKey]: filteredData };
    });
}
