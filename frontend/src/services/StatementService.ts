import { composerApi } from "./apis"
import {
  AnatomicalEntity,
  ConnectivityStatement,
  ConnectivityStatementUpdate,
  PaginatedBaseConnectivityStatementList, PatchedConnectivityStatement,
  PatchedConnectivityStatementUpdate
} from '../apiclient/backend'
import { AbstractService } from "./AbstractService"
import { QueryParams } from "../redux/statementSlice"
import { checkOwnership } from "../helpers/ownershipAlert";
import { ChangeRequestStatus } from "../helpers/settings";

class ConnectivityStatementService extends AbstractService {
  async save(
    connectivityStatement: ConnectivityStatement,
    options: { onCancel?: () => void } = {} // Options object with defaults
  ) {
    const {
      onCancel = () => {
      }
    } = options;
    connectivityStatement.forward_connection = connectivityStatement.forward_connection?.map((cs: any) => cs.id);

    if (connectivityStatement.id) {
      const updateData: ConnectivityStatementUpdate = {
        ...connectivityStatement,
        origins: connectivityStatement.origins?.map((o: AnatomicalEntity) => o.id) || [],
      };

      return await this.update(updateData, onCancel); // Pass onCancel to update
    }

    // If it's a new connectivity statement, creation doesn't need ownership check
    return composerApi.composerConnectivityStatementCreate(connectivityStatement).then((response: any) => response.data);
  }

  async update(
    connectivityStatement: ConnectivityStatementUpdate,
    onCancel: () => void = () => {
    }
  ) {
    const id = connectivityStatement.id || -1;

    try {
      await composerApi.composerConnectivityStatementUpdate(id, connectivityStatement).then((response: any) => response.data);
      return ChangeRequestStatus.SAVED;
    } catch (error) {
      return await checkOwnership(
        id,
        // Retry the update after ownership is reassigned, including new owner ID
        async (userId) => {
          const updatedStatement = {
            ...connectivityStatement,
          };
          await composerApi.composerConnectivityStatementUpdate(id, updatedStatement).then((response: any) => response.data);
          return ChangeRequestStatus.SAVED;
        },
        () => {
          onCancel();
          return ChangeRequestStatus.CANCELLED;
        },
        (owner) =>
          `This statement is currently assigned to ${owner.first_name}. You are in read-only mode. Would you like to assign this statement to yourself and gain edit access?`,
      );
    }
  }

  async partialUpdate(
    id: number,
    patchedConnectivityStatementUpdate: PatchedConnectivityStatementUpdate,
    onCancel: () => void = () => {
    }
  ) {
    try {
      return await composerApi.composerConnectivityStatementPartialUpdate(id, patchedConnectivityStatementUpdate).then((response: any) => response.data);
    } catch (error) {
      return checkOwnership(
        id,
        // Retry the partial update after ownership is reassigned, including new owner ID
        async (userId: number) => {
          const updatedPatchedStatement = {
            ...patchedConnectivityStatementUpdate,
          };
          return composerApi.composerConnectivityStatementPartialUpdate(id, updatedPatchedStatement).then((response: any) => response.data);
        },
        () => {
          onCancel();
          return ChangeRequestStatus.CANCELLED; // Return 'canceled' when onCancel is triggered
        },
        (owner) =>
          `This statement is currently assigned to ${owner.first_name}. You are in read-only mode. Would you like to assign this statement to yourself and gain edit access?`,
      );
    }
  }

  async remove(id: number, onCancel: () => void = () => {
  }) {
    try {
      return await composerApi.composerConnectivityStatementDestroy(id).then((response: any) => response.data);
    } catch (e) {
      return checkOwnership(
        id,
        async () => {
          return composerApi.composerConnectivityStatementDestroy(id).then((response: any) => response.data);
        },
        () => {
          onCancel();
          return ChangeRequestStatus.CANCELLED; // Return 'canceled' when onCancel is triggered
        },
        (owner) =>
          `This statement is currently assigned to ${owner.first_name}. You are in read-only mode. Would you like to assign this statement to yourself and gain edit access?`,
      );
    }
  }

  async clone(id: number) {
    try {
      return await composerApi.composerConnectivityStatementCloneStatementRetrieve(id).then((response: any) => response.data);
    } catch (e) {
      console.log(e)
    }
  }

  async getObject(id: string): Promise<ConnectivityStatement> {
    return composerApi.composerConnectivityStatementRetrieve(Number(id)).then((response: any) => response.data);
  }

  async doTransition(connectivityStatement: ConnectivityStatement, transition: string) {
    const id = connectivityStatement.id || -1;
    return composerApi.composerConnectivityStatementDoTransitionCreate(id, transition, connectivityStatement).then((response: any) => response.data);
  }

  async addTag(id: number, tagId: number, onCancel: () => void = () => { }): Promise<ConnectivityStatement | string> {
    try {
      return await composerApi.composerConnectivityStatementAddTagCreate(id, tagId).then((response: any) => response.data as ConnectivityStatement);
    } catch (error) {
      return await checkOwnership(
        id,
        async () => {
          return await composerApi.composerConnectivityStatementAddTagCreate(id, tagId).then((response: any) => response.data as ConnectivityStatement);
        },
        () => {
          onCancel();
          return ChangeRequestStatus.CANCELLED;
        },
        (owner) =>
          `This statement is currently assigned to ${owner.first_name}. You are in read-only mode. Would you like to assign this statement to yourself and gain edit access?`
      );
    }
  }
  async addSpecie(id: number, specieId: number, onCancel: () => void = () => { }): Promise<string> {
    try {
      return await composerApi.composerConnectivityStatementAddSpecieCreate(id, specieId).then((response: any) => response.data);
    } catch (error) {
      return await checkOwnership(
        id,
        async () => {
          return await composerApi.composerConnectivityStatementAddSpecieCreate(id, specieId).then((response: any) => response.data as ConnectivityStatement);
        },
        () => {
          onCancel();
          return ChangeRequestStatus.CANCELLED;
        },
        (owner) =>
          `This statement is currently assigned to ${owner.first_name}. You are in read-only mode. Would you like to assign this statement to yourself and gain edit access?`
      );
    }
  }

  async removeTag(id: number, tagId: number, onCancel: () => void = () => { }): Promise<string> {
    try {
      return await composerApi.composerConnectivityStatementDelTagCreate(id, tagId).then((response: any) => response.data);
    } catch (err) {
      return await checkOwnership(
        id,
        async () => {
          return await composerApi.composerConnectivityStatementDelTagCreate(id, tagId).then((response: any) => response.data as ConnectivityStatement);
        },
        () => {
          onCancel();
          return ChangeRequestStatus.CANCELLED;
        },
        (owner) =>
          `This statement is currently assigned to ${owner.first_name}. You are in read-only mode. Would you like to assign this statement to yourself and gain edit access?`
      );
    }
  }

  async removeSpecie(id: number, specieId: number, onCancel: () => void = () => { }): Promise<string> {
    try {
      return await composerApi.composerConnectivityStatementDelSpecieCreate(id, specieId).then((response: any) => response.data);
    } catch (err) {
      return await checkOwnership(
        id,
        async () => {
          return await composerApi.composerConnectivityStatementDelSpecieCreate(id, specieId).then((response: any) => response.data as ConnectivityStatement);
        },
        () => {
          onCancel();
          return ChangeRequestStatus.CANCELLED;
        },
        (owner) =>
          `This statement is currently assigned to ${owner.first_name}. You are in read-only mode. Would you like to assign this statement to yourself and gain edit access?`
      );
    }
  }

  async getList(queryOptions: QueryParams): Promise<PaginatedBaseConnectivityStatementList> {
    const {
      origins,
      limit,
      ordering,
      index,
      knowledgeStatement,
      stateFilter,
      tagFilter,
      sentenceId,
      excludeSentenceId,
      excludeIds
    } = queryOptions;
    return composerApi.composerConnectivityStatementList(
      undefined, excludeIds, excludeSentenceId, knowledgeStatement, limit, undefined, index, ordering, origins, sentenceId, stateFilter, tagFilter
    ).then((res: any) => res.data);
  }

  async getPhenotypeList() {
    return composerApi.composerPhenotypeList(undefined).then((res: any) => res.data);
  }

  async getSexList() {
    return composerApi.composerSexList(undefined).then((res: any) => res.data);
  }

  async assignOwner(id: number, patchedConnectivityStatement?: PatchedConnectivityStatement): Promise<ConnectivityStatement> {
    return composerApi.composerConnectivityStatementAssignOwnerPartialUpdate(id, patchedConnectivityStatement).then((response: any) => response.data);
  }
}

const connectivityStatementService = new ConnectivityStatementService();
export default connectivityStatementService;
