import { getAgentDataAsync } from '~/server/utils/csgoAPI';
import { createDataApiHandler } from '~/server/utils/dataFilters';

export default createDataApiHandler(getAgentDataAsync, 'agents');
