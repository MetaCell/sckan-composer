import { composerApi } from "./apis";
import { AnsDivision } from "../apiclient/backend";

export let ansDivisions = (function () {
  let ansDivisionsList: AnsDivision[] = [];

  return {
    // public interface
    setAnsDivisions: async function () {
      return composerApi.composerAnsDivisionList(undefined).then((resp: any) => {
        ansDivisionsList = resp.data.results;
      });
    },
    getAnsDivisions: function (): AnsDivision[] {
      return ansDivisionsList;
    },
  };
})();

