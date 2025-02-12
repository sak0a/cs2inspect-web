import {getKeychainData} from '~/server/utils/csgoData';
import {APIKeychain} from "~/server/utils/interfaces";

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const keychainData = getKeychainData();

    // Filter skins based on query parameters
    const filteredKeychains = keychainData?.filter((keychain: any) => {
        return Object.keys(query).every((key) => {
            // Check if the skin has the property and if it matches the query
            if (key in keychain) {
                const queryValue = query[key] as string; // Cast to string for comparison
                const keychainValue = keychain[key];

                // Handle nested objects (like rarity)
                if (typeof keychainValue === 'object' && keychainValue !== null) {
                    return keychainValue.id === queryValue || keychainValue.name === queryValue || keychainValue.color === queryValue;
                }

                // For other fields, perform a direct comparison
                return keychainValue === queryValue;
            }
            return true; // If the key doesn't exist in the skin, ignore it
        });
    });

    return { keychains: filteredKeychains };
});
