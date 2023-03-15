import { composerApi } from "./apis"
import { ConnectivityStatement, PaginatedConnectivityStatementList } from '../apiclient/backend'
import { AbstractService } from "./AbstractService"
import { QueryParams } from "../redux/statementSlice"

class ConnectivityStatementService extends AbstractService {
  async save(connectivityStatement: ConnectivityStatement) {
    if (connectivityStatement.id) {
      return this.update(connectivityStatement)
    }
    return composerApi.composerConnectivityStatementCreate(connectivityStatement).then((response: any) => response.data)
  }
  async update(connectivityStatement: ConnectivityStatement) {
    return composerApi.composerConnectivityStatementUpdate(connectivityStatement.id, connectivityStatement).then((response: any) => response.data)
  }
  async remove(id: number) {
    return composerApi.composerConnectivityStatementDestroy(id).then((response: any) => response.data)
  }
  async getObject(id: string): Promise<ConnectivityStatement> {
    return composerApi.composerConnectivityStatementRetrieve(Number(id)).then((response: any) => response.data)
  }
  async doTransition(connectivityStatement: ConnectivityStatement, transition: string) {
    return composerApi.composerConnectivityStatementDoTransitionCreate(connectivityStatement.id, transition, connectivityStatement).then((response: any) => response.data)
  }
  async addTag(id: number, tagId: number): Promise<ConnectivityStatement> {
    return composerApi.composerConnectivityStatementAddTagCreate(id, tagId).then((response: any) => response.data)
  }
  async removeTag(id: number, tagId: number): Promise<ConnectivityStatement> {
    return composerApi.composerConnectivityStatementDelTagCreate(id, tagId).then((response: any) => response.data)
  }
  async getList(queryOptions: QueryParams): Promise<PaginatedConnectivityStatementList> {
    const { limit, ordering, index, knowledgeStatement, stateFilter, tagFilter } = queryOptions
    return composerApi.composerConnectivityStatementList(undefined, knowledgeStatement, limit, undefined, index, ordering, undefined, undefined, stateFilter, tagFilter).then((res: any) => res.data)
  }
  async getANSDivisionList() {
    return composerApi.composerAnsDivisionList(undefined).then((res: any) => res.data)
  }
  async getBiologicalSexList() {
    return composerApi.composerBiologicalSexList(undefined).then((res: any) => res.data)
  }
}

const connectivityStatementService = new ConnectivityStatementService()
export default connectivityStatementService
