import { AxiosRequestConfig } from "axios";
import { Configuration } from "../apiclient/backend";
import { MetacellAuthApi, ComposerApi } from "../apiclient/backend/api";

const options: AxiosRequestConfig = {
  withCredentials: true,
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName:'X-CSRFToken'
};

const configuration: Configuration = {
  basePath: `${window.location.origin}`,
  baseOptions: options,
  isJsonMime: function (mime: string): boolean {
    return mime === "application/json";
  }
};

export const authApi = new MetacellAuthApi(configuration);
export const composerApi = new ComposerApi(configuration);
