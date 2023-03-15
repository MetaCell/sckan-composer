import { composerApi } from "./apis"
import { Doi } from "../apiclient/backend"
import { AbstractService } from "./AbstractService"


class DoiService extends AbstractService {
  // async save({connectivity_statement_id, doi}: {connectivity_statement_id: number, doi: string}) {
    async save(doi: Doi) {
      return composerApi.composerConnectivityStatementAddDoiCreate(doi.doi, doi.connectivity_statement_id).then((response: any) => response.data)
  }
  async delete(doiId: number, connectivityStatementId: number) {
    return await composerApi.composerConnectivityStatementDelDoiDestroy(doiId, connectivityStatementId).then((response: any) => response.data)  
  }
  async getObject(id: string): Promise<Doi> {
    return {} as Doi
  }
}

const doiService = new DoiService()
export default doiService
