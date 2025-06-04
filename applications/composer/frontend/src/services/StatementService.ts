import { composerApi } from "./apis"
import {
  ActionEnum,
  AnatomicalEntity,
  BulkAction,
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
        async (fetchedData, userId) => {
          // Update the statement with the new ownership if reassigned
          const updatedStatement = { ...connectivityStatement, owner_id: userId };
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
        async () => {
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
      console.error(e)
    }
  }

  async getObject(id: string): Promise<ConnectivityStatement> {
    return composerApi.composerConnectivityStatementRetrieve(Number(id)).then((response: any) => response.data);
  }

  async getRelationshipOptions(): Promise<any> {
    return composerApi.composerRelationshipList().then((response: any) => response.data);
  }

  async assignRelationship(data: any): Promise<any> {
    return composerApi.composerConnectivityStatementTripleCreate(data).then((response: any) => response.data);
  }

  async deleteRelationship(data: any): Promise<any> {
    return composerApi.composerConnectivityStatementTripleDestroy(data.id).then((response: any) => response.data);
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
      hasStatementBeenExportedFilter,
      knowledgeStatement,
      stateFilter,
      tagFilter,
      populationSetFilter,
      sentenceId,
      excludeSentenceId,
      excludeIds,
      include
    } = queryOptions;
  
    return composerApi.composerConnectivityStatementList(
      undefined,
      excludeIds,
      excludeSentenceId,
      hasStatementBeenExportedFilter,
      include,
      knowledgeStatement,
      limit,
      undefined,
      index,
      ordering,
      origins,
      populationSetFilter,
      sentenceId,
      stateFilter,
      tagFilter
    ).then((res: any) => res.data);
  }
  

  async getPhenotypeList() {
    return composerApi.composerPhenotypeList(undefined).then((res: any) => res.data);
  }

  async getSexList() {
    return composerApi.composerSexList(undefined).then((res: any) => res.data);
  }

  async getAlertsList() {
    return composerApi.composerAlertList(undefined).then((res: any) => res.data);
  }

  async createAlert(statementAlert: any, onCancel: () => void) {
    try {
      return await composerApi.composerStatementAlertCreate(statementAlert).then((res: any) => res.data);
    } catch (err) {
      return await checkOwnership(
        statementAlert.connectivity_statement_id,
        async () => {
          return await composerApi.composerStatementAlertCreate(statementAlert).then((res: any) => res.data);
        },
        () => {
          onCancel()
        },
        (owner) =>
          `This statement is currently assigned to ${owner.first_name}. You are in read-only mode. Would you like to assign this statement to yourself and gain edit access?`
      );
    }
  }

  async destroyAlert(id: number, connectivity_statement_id: number, onCancel: () => void) {
    try {
      return await composerApi.composerStatementAlertDestroy(id).then((response: any) => response.data);
    } catch (err) {
      return await checkOwnership(
        connectivity_statement_id,
        async () => {
          return await composerApi.composerStatementAlertDestroy(id).then((response: any) => response.data);
        },
        () => {
          onCancel()
        },
        (owner) =>
          `This statement is currently assigned to ${owner.first_name}. You are in read-only mode. Would you like to assign this statement to yourself and gain edit access?`
      );
    }
  }
  async updateAlert(id: number, statementAlert: any, onCancel: () => void) {
    try {
      return await composerApi.composerStatementAlertUpdate(id, statementAlert).then((response: any) => response.data);
    } catch (err) {
      return await checkOwnership(
        statementAlert.connectivity_statement_id,
        async () => {
          return await composerApi.composerStatementAlertUpdate(id, statementAlert).then((response: any) => response.data);
        },
        () => {
          onCancel()
        },
        (owner) =>
          `This statement is currently assigned to ${owner.first_name}. You are in read-only mode. Would you like to assign this statement to yourself and gain edit access?`
      );
    }
  }

  async assignOwner(id: number, patchedConnectivityStatement?: PatchedConnectivityStatement): Promise<ConnectivityStatement> {
    return composerApi.composerConnectivityStatementAssignOwnerPartialUpdate(id, patchedConnectivityStatement).then((response: any) => response.data);
  }

  /**
   * Fetch options for assignable users and possible state transitions.
   * Uses connectivity statement filters or explicit IDs.
   */
  async fetchOptions(queryOptions: QueryParams): Promise<{ assignable_users: any[]; possible_transitions: any }> {
    const {
      excludeIds,
      include,
      notes,
      ordering,
      hasStatementBeenExportedFilter,
      stateFilter,
      populationSetFilter,
      tagFilter,
      knowledgeStatement,
      origins,
      sentenceId,
      excludeSentenceId
    } = queryOptions;

    return composerApi
      .composerConnectivityStatementAvailableOptionsRetrieve(
        undefined,         // destinations (if not used)
        excludeIds,
        excludeSentenceId,
        hasStatementBeenExportedFilter,
        include,
        knowledgeStatement,
        notes,
        ordering,
        origins,
        populationSetFilter,
        sentenceId,
        stateFilter,
        tagFilter
      )
      .then((response: any) => response.data);
  }

  /**
   * Perform a bulk action on connectivity statements.
   * Ensures the correct parameter order even if the API changes.
   * @param queryOptions - The filters or selection criteria.
   * @param bulkAction - The action to perform (e.g., assign user, add tag).
   */
  async performBulkAction(queryOptions: QueryParams, bulkAction: BulkAction): Promise<{ message: string }> {
    const {
      excludeIds,
      include,
      notes,
      ordering,
      hasStatementBeenExportedFilter,
      stateFilter,
      populationSetFilter,
      tagFilter,
      knowledgeStatement,
      origins,
      sentenceId,
      excludeSentenceId
    } = queryOptions;
  
    return composerApi
      .composerConnectivityStatementBulkActionCreate(
        undefined,
        excludeIds,
        excludeSentenceId,
        hasStatementBeenExportedFilter,
        include,
        knowledgeStatement,
        notes,
        ordering,
        origins,
        populationSetFilter,
        sentenceId,
        stateFilter,
        tagFilter,
        bulkAction
      )
      .then((response: any) => response.data);
  }

  /**
   * Bulk assign a user to selected connectivity statements.
   */
  async assignUserBulk(queryOptions: QueryParams, userId: number): Promise<{ message: string }> {
    return this.performBulkAction(queryOptions, { action: ActionEnum.AssignUser, user_id: userId });
  }

  /**
   * Bulk assign a tag to selected connectivity statements.
   */
  async assignTagBulk(queryOptions: QueryParams, addTagIds: number[], removeTagIds: number[]): Promise<{ message: string }> {
    return this.performBulkAction(queryOptions, { action: ActionEnum.AssignTag, add_tag_ids: addTagIds, remove_tag_ids: removeTagIds });
  }

  /**
   * Bulk add a note to selected connectivity statements.
   */
  async writeNoteBulk(queryOptions: QueryParams, noteText: string): Promise<{ message: string }> {
    return this.performBulkAction(queryOptions, { action: ActionEnum.WriteNote, note_text: noteText });
  }

  /**
   * Bulk change the status of selected connectivity statements.
   */
  async changeStatusBulk(queryOptions: QueryParams, newStatus: string): Promise<{ message: string }> {
    return this.performBulkAction(queryOptions, { action: ActionEnum.ChangeStatus, new_status: newStatus });
  }

    /**
     * Bulk assign connectivity statements to a population set.
     */
    async assignPopulationSetBulk(queryOptions: QueryParams, populationSetId: number): Promise<{ message: string }> {
      return this.performBulkAction(queryOptions, { action: ActionEnum.AssignPopulationSet, population_set_id: populationSetId });
    }
}


const connectivityStatementService = new ConnectivityStatementService();
export default connectivityStatementService;
