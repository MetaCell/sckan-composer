import { composerApi } from "./apis"
import { Provenance } from "../apiclient/backend"
import { AbstractService } from "./AbstractService"


class ProvenanceService extends AbstractService {
    async save(provenance:any) {
      return composerApi.composerConnectivityStatementAddProvenanceCreate(provenance.statementId, provenance.uri ).then((response: any) => response.data)
  }
  async delete(provenanceId: number, connectivityStatementId: number) {
    return await composerApi.composerConnectivityStatementDelProvenanceDestroy(connectivityStatementId, provenanceId).then((response: any) => response.data)
  }
  async getObject(id: string): Promise<Provenance> {
    return {} as Provenance
  }
}

const provenanceService = new ProvenanceService()
export default provenanceService
