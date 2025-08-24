import { getCollectibleData } from '~/server/utils/csgoAPI';
import { createDataApiHandler } from '~/server/utils/dataFilters';

export default createDataApiHandler(getCollectibleData, 'collectibles');
