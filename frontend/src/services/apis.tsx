import { MetacellAuthApi, ComposerApi } from "../apiclient/backend/api"

const BASE_PATH = '/';
export const authApi = new MetacellAuthApi();
export const composerApi = new ComposerApi();