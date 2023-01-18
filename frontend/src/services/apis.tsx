import { MetacellAuthApi, ComposerApi } from "../apiclient/backend/api"

const baseUrl = `${window.location.origin}`;

export const authApi = new MetacellAuthApi(undefined, baseUrl);
export const composerApi = new ComposerApi(undefined, baseUrl);
