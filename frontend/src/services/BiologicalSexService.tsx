import { composerApi } from "./apis";
import { BiologicalSex} from "../apiclient/backend";

export let biologicalSexes = (function () {
  let biologicalSexesList: BiologicalSex[] = [];

  return {
    // public interface
    setBiologicalSexes: async function () {
      return composerApi.composerBiologicalSexList(undefined).then((resp: any) => {
        biologicalSexesList = resp.data.results;
      });
    },
    getBiologicalSexes: function (): BiologicalSex[] {
      return biologicalSexesList;
    },
  };
})();

