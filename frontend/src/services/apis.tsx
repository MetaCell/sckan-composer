import { MetacellAuthApi, ComposerApi } from "../apiclient/backend/api"

export const authApi = new MetacellAuthApi(undefined, "/");
export const composerApi = new ComposerApi(undefined, "/");
