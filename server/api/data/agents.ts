import { getAgentDataAsync } from '~/server/utils/csgoAPI';
import { createDataApiHandler } from '~/server/utils/data/dataFilters';

export default createDataApiHandler(getAgentDataAsync);
