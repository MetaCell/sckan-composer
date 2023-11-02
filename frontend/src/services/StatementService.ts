import { composerApi } from "./apis"
import {
  AnatomicalEntity,
  ConnectivityStatement,
  ConnectivityStatementUpdate,
  PaginatedConnectivityStatementList
} from '../apiclient/backend'
import { AbstractService } from "./AbstractService"
import { QueryParams } from "../redux/statementSlice"

class ConnectivityStatementService extends AbstractService {
  async save(connectivityStatement: ConnectivityStatement) {

    connectivityStatement.forward_connection = connectivityStatement.forward_connection?.map((cs:any) => cs.id)

    if (connectivityStatement.id) {
      const updateData: ConnectivityStatementUpdate = {
        ...connectivityStatement,
        origins: connectivityStatement.origins?.map((o: AnatomicalEntity) => o.id) || []
      };

      return this.update(updateData)
    }
    return composerApi.composerConnectivityStatementCreate(connectivityStatement).then((response: any) => response.data)
  }
  async update(connectivityStatement: ConnectivityStatementUpdate) {
    const id = connectivityStatement.id || -1
    return composerApi.composerConnectivityStatementUpdate(id, connectivityStatement).then((response: any) => response.data)
  }
  async remove(id: number) {
    return composerApi.composerConnectivityStatementDestroy(id).then((response: any) => response.data)
  }
  async clone(id: number) {
    return composerApi.composerConnectivityStatementCloneStatementRetrieve(id).then((response: any) => response.data)
  }
  async getObject(id: string): Promise<ConnectivityStatement> {
    return composerApi.composerConnectivityStatementRetrieve(Number(id)).then((response: any) => response.data)
  }
  async doTransition(connectivityStatement: ConnectivityStatement, transition: string) {
    const id = connectivityStatement.id || -1
    return composerApi.composerConnectivityStatementDoTransitionCreate(id, transition, connectivityStatement).then((response: any) => response.data)
  }
  async addTag(id: number, tagId: number): Promise<ConnectivityStatement> {
    return composerApi.composerConnectivityStatementAddTagCreate(id, tagId).then((response: any) => response.data)
  }
  async addSpecie(id: number, specieId: number): Promise<ConnectivityStatement> {
    return composerApi.composerConnectivityStatementAddSpecieCreate(id, specieId).then((response: any) => response.data)
  }
  async removeTag(id: number, tagId: number): Promise<ConnectivityStatement> {
    return composerApi.composerConnectivityStatementDelTagCreate(id, tagId).then((response: any) => response.data)
  }
  async removeSpecie(id: number, specieId: number): Promise<ConnectivityStatement> {
    return composerApi.composerConnectivityStatementDelSpecieCreate(id, specieId).then((response: any) => response.data)
  }
  async getList(queryOptions: QueryParams): Promise<PaginatedConnectivityStatementList> {
    const { origin, limit, ordering, index, knowledgeStatement, stateFilter, tagFilter, sentenceId, excludeSentenceId } = queryOptions
    return composerApi.composerConnectivityStatementList(undefined, excludeSentenceId, knowledgeStatement, limit, undefined, index, ordering, origin, sentenceId, stateFilter, tagFilter).then((res: any) => res.data)
  }
  async getPhenotypeList() {
    return composerApi.composerPhenotypeList(undefined).then((res: any) => res.data)
  }
  async getSexList() {
    return composerApi.composerSexList(undefined).then((res: any) => res.data)
  }
}

const connectivityStatementService = new ConnectivityStatementService()
export default connectivityStatementService
