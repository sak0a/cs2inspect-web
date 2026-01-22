import { getCollectibleDataAsync } from '~/server/utils/csgoAPI';
import { createDataApiHandler } from '~/server/utils/data/dataFilters';

export default createDataApiHandler(getCollectibleDataAsync, 'collectibles');
