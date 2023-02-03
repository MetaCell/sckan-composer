import { composerApi } from "./apis"
import { ConnectivityStatement } from '../apiclient/backend/api'
import { AbstractService } from "./AbstractService"

class ConnectivityStatementService extends AbstractService {
  async save(connectivityStatement: ConnectivityStatement) {
    return composerApi.composerConnectivityStatementUpdate(connectivityStatement.id, connectivityStatement).then((response: any) => response.data)
  }
  async getObject(id: string): Promise<ConnectivityStatement> {
    return composerApi.composerConnectivityStatementRetrieve(Number(id)).then((response: any) => response.data)
  }
  async doTransition(connectivityStatement: ConnectivityStatement, transition: string) {
    return composerApi.composerConnectivityStatementDoTransitionCreate(connectivityStatement.id, transition, connectivityStatement).then((response: any) => response.data)
  }
}

const connectivityStatementService = new ConnectivityStatementService()
export default connectivityStatementService
