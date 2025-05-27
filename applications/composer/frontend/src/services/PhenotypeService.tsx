import { composerApi } from "./apis";
import { Phenotype } from "../apiclient/backend";

export let phenotypes = (function () {
  let phenotypesList: Phenotype[] = [];

  return {
    // public interface
    setPhenotypes: async function () {
      return composerApi.composerPhenotypeList(undefined).then((resp: any) => {
        phenotypesList = resp.data.results;
      });
    },
    getPhenotypes: function (): Phenotype[] {
      return phenotypesList;
    },
  };
})();

