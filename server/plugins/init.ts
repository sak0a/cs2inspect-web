import {
    initData,
} from '../utils/csgoData';

import { runAllTests as runAllInspectTests } from '../utils/csinspect/base';

export default defineNitroPlugin(async () => {
    await initData()
});