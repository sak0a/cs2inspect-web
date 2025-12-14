import { getMusicKitDataAsync } from '~/server/utils/csgoAPI';
import { createDataApiHandler } from '~/server/utils/dataFilters';

export default createDataApiHandler(getMusicKitDataAsync, 'musickits');
