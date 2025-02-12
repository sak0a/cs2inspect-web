import {getMusicKitData} from '~/server/utils/csgoData';
import {APIMusicKit} from "~/server/utils/interfaces";

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const musicKitData = getMusicKitData();

    // Filter skins based on query parameters
    const filteredMusicKits = musicKitData?.filter((musicKit: any) => {
        return Object.keys(query).every((key) => {
            // Check if the skin has the property and if it matches the query
            if (key in musicKit) {
                const queryValue = query[key] as string; // Cast to string for comparison
                const musicKitValue = musicKit[key];

                // Handle nested objects (like rarity)
                if (typeof musicKitValue === 'object' && musicKitValue !== null) {
                    return musicKitValue.id === queryValue || musicKitValue.name === queryValue || musicKitValue.color === queryValue;
                }

                // For other fields, perform a direct comparison
                return musicKitValue === queryValue;
            }
            return true; // If the key doesn't exist in the skin, ignore it
        });
    });

    return { musickits: filteredMusicKits };
});
