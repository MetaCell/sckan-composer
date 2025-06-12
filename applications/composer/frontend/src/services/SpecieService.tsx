import {composerApi} from "./apis";
import {Specie} from "../apiclient/backend";
import {AbstractService} from "./AbstractService";

export let species = (function () {
  let specieList: Specie[] = [];

  return {
    // public interface
    setSpecieList: async function () {
      return composerApi.composerSpecieList(undefined).then((resp: any) => {
        specieList = resp.data.results;
      });
    },
    getSpecieList: function (): Specie[] {
      return specieList;
    },
  };
})();

class SpecieService extends AbstractService {
  async save(specie: any) {
    const specieId: number | undefined = species.getSpecieList().find((t: Specie) => t.name === specie.name)?.id
    if (specieId) {
      return specie.service.addSpecie(specie.parentId, specieId).then((response: any) => response)
    }
    return specie.service.getObject(specie.parentId).then((response: any) => response)
  }

  async getList() {
    return composerApi.composerSpecieList(undefined).then((res: any) => res.data)
  }

  async getObject(id: string): Promise<Specie> {
    return {} as Specie
  }
}

const specieService = new SpecieService()
export default specieService
