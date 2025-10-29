import { composerApi } from "./apis"
import { AbstractService } from "./AbstractService"

// Temporary type until API client is regenerated
interface ExpertConsultant {
  id: number;
  uri: string;
  connectivity_statement_id: number;
}

class ExpertConsultantService extends AbstractService {
    async save(expertConsultant:any) {
      return composerApi.composerConnectivityStatementAddExpertConsultantCreate(
        expertConsultant.statementId, 
        { uri: expertConsultant.uri }
      ).then((response: any) => response.data)
  }
  async delete(expertConsultantId: number, connectivityStatementId: number) {
    return await composerApi.composerConnectivityStatementDelExpertConsultantDestroy(expertConsultantId, connectivityStatementId).then((response: any) => response.data)
  }
  async getObject(id: string): Promise<ExpertConsultant> {
    return {} as ExpertConsultant
  }
}

const expertConsultantService = new ExpertConsultantService()
export default expertConsultantService
