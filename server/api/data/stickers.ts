import {getStickerData} from '~/server/utils/csgoData';
import {APISticker} from "~/server/utils/interfaces";

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const stickerData = getStickerData();

    // Filter skins based on query parameters
    const filteredStickers = stickerData?.filter((sticker: any) => {
        return Object.keys(query).every((key) => {
            // Check if the skin has the property and if it matches the query
            if (key in sticker) {
                const queryValue = query[key] as string; // Cast to string for comparison
                const stickerValue = sticker[key];

                // Handle nested objects (like rarity)
                if (typeof stickerValue === 'object' && stickerValue !== null) {
                    return stickerValue.id === queryValue || stickerValue.name === queryValue || stickerValue.color === queryValue;
                }

                // For other fields, perform a direct comparison
                return stickerValue === queryValue;
            }
            return true; // If the key doesn't exist in the skin, ignore it
        });
    });

    return { stickers: filteredStickers };
});
