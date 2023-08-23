import { composerApi } from "./apis";
import { Sex} from "../apiclient/backend";

export let sexes = (function () {
  let sexesList: Sex[] = [];

  return {
    // public interface
    setSexes: async function () {
      return composerApi.composerSexList(undefined).then((resp: any) => {
        sexesList = resp.data.results;
      });
    },
    getSexes: function (): Sex[] {
      return sexesList;
    },
  };
})();

