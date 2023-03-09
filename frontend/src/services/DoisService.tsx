import { composerApi } from "./apis"
import { Doi } from "../apiclient/backend"
import { AbstractService } from "./AbstractService"


class DoiService extends AbstractService {
  async save({doi, parentId}: {doi: number, parentId: number}) {
    return composerApi.composerConnectivityStatementAddDoiCreate(doi, parentId).then((response: any) => response.data)
  }
  async getObject(id: string): Promise<Doi> {
    return {} as Doi
  }
}

const doiService = new DoiService()
export default doiService