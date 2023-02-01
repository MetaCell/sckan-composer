import { composerApi } from "./apis";
import { ConnectivityStatement } from '../apiclient/backend/api';
import { AbstractService } from "./AbstractService";

class ConnectivityStatementService extends AbstractService {
  async save(object: any) {
    return composerApi.composerConnectivityStatementPartialUpdate(object.id, object).then((response: any) => response.data)
  }
  async getObject(id: string): Promise<ConnectivityStatement> {
    return composerApi.composerConnectivityStatementRetrieve(Number(id)).then((response: any) => response.data)
  }
}

export async function statementRetrieve(id: number): Promise<any> {
  return composerApi.composerConnectivityStatementRetrieve(id).then((response: any) => {
    if (response.status === 200) {
      return response.data
    } else {
      console.log("Error")
    }
  })
}

export default new ConnectivityStatementService()
