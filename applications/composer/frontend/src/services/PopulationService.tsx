import { composerApi } from "./apis";
import { PopulationSet } from "../apiclient/backend";

export let populations = (function () {
  let populationList: PopulationSet[] = [];

  return {
    // public interface
    setPopulations: async function () {
      return composerApi.composerPopulationList(undefined).then((resp: any) => {
        populationList = resp.data.results;
      });
    },
    getPopulations: function (): PopulationSet[] {
      return populationList;
    },
  };
})();

