import { getStickerDataAsync } from '~/server/utils/csgoAPI';
import { createDataApiHandler } from '~/server/utils/dataFilters';

export default createDataApiHandler(getStickerDataAsync, 'stickers');
