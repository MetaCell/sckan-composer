import { composerApi } from "./apis";
import { ActionEnum, BulkAction, PaginatedSentenceList, PatchedSentence, Sentence } from '../apiclient/backend';
import { AbstractService } from "./AbstractService";
import { QueryParams } from "../redux/sentenceSlice";
import { checkSentenceOwnership } from "../helpers/ownershipAlert";

export let batchNames = (function () {
  let batchNameList: string[] = [];

  return {
    /**
     * Fetch and set the available batch names from the API.
     */
    setBatchNameList: async function (): Promise<void> {
      return composerApi.composerSentenceBatchNamesRetrieve().then((resp: any) => {
        batchNameList = resp.data;
      });
    },

    /**
     * Get the cached list of batch names.
     */
    getBatchNameList: function (): string[] {
      return batchNameList;
    },
  };
})();



class SentenceService extends AbstractService {
  async save(sentence: Sentence) {
    if (!sentence.id) {
      return composerApi.composerSentenceCreate(sentence).then((response: any) => response.data)
    }
    else {
      try {
        return await composerApi.composerSentenceUpdate(sentence.id, sentence).then((response: any) => response.data)
      } catch (err) {
        return await checkSentenceOwnership(
          sentence.id,
          async () => {
            return await composerApi.composerSentenceUpdate(sentence.id, sentence).then((response: any) => response.data)
          },
          (fetchedData, userId) => {
            return fetchedData;
          },
          (owner) =>
            `This sentence is currently assigned to ${owner.first_name}. You are in read-only mode. Would you like to assign this statement to yourself and gain edit access?`
        );
      }
    }
  }

  async getObject(id: string): Promise<Sentence> {
    return composerApi.composerSentenceRetrieve(Number(id)).then((response: any) => response.data)
  }

  async doTransition(sentence: Sentence, transition: string, onCancel: () => void = () => { }) {
    try {
      return await composerApi.composerSentenceDoTransitionCreate(sentence.id, transition, sentence).then((response: any) => response.data)
    } catch (err) {
      return await checkSentenceOwnership(
        sentence.id,
        async () => {
          return await composerApi.composerSentenceDoTransitionCreate(sentence.id, transition, sentence).then((response: any) => response.data)
        },
        (fetchedData) => {
          onCancel();
          return fetchedData;
        },
        (owner) =>
          `This sentence is currently assigned to ${owner.first_name}. You are in read-only mode. Would you like to assign this statement to yourself and gain edit access?`
      );
    }
  }

  // @ts-ignore
  async addTag(id: number, tagId: number, onCancel: () => void = () => { }): Promise<string> {
    try {
      return await composerApi.composerSentenceAddTagCreate(id, tagId).then((response: any) => response.data)
    } catch (err) {
      return await checkSentenceOwnership(
        id,
        async () => {
          return await composerApi.composerSentenceAddTagCreate(id, tagId).then((response: any) => response.data)
        },
        (fetchedData) => {
          onCancel();
          return fetchedData;
        },
        (owner) =>
          `This sentence is currently assigned to ${owner.first_name}. You are in read-only mode. Would you like to assign this statement to yourself and gain edit access?`
      );
    }
  }

  async removeTag(id: number, tagId: number, onCancel: () => void = () => { }): Promise<string> {
    try {
      return await composerApi.composerSentenceDelTagCreate(id, tagId).then((response: any) => response.data)
    } catch (err) {
      return await checkSentenceOwnership(
        id,
        async () => {
          return await composerApi.composerSentenceDelTagCreate(id, tagId).then((response: any) => response.data)
        },
        (fetchedData) => {
          onCancel();
          return fetchedData;
        },
        (owner) =>
          `This sentence is currently assigned to ${owner.first_name}. You are in read-only mode. Would you like to assign this statement to yourself and gain edit access?`
      );
    }
  }
  async getList(queryOptions: QueryParams): Promise<PaginatedSentenceList> {
    const { exclude, include, limit, ordering, index, title, stateFilter, tagFilter, batchNameFilter } = queryOptions
    return composerApi.composerSentenceList(batchNameFilter, exclude, include, limit, undefined, index, ordering, stateFilter, tagFilter, title ).then((res: any) => res.data)
  }
  async assignOwner(id: number, patchedSentence?: PatchedSentence): Promise<Sentence> {
    return composerApi.composerSentenceAssignOwnerPartialUpdate(id, patchedSentence).then((response: any) => response.data);
  }


  /**
   * Fetch options for assignable users and possible state transitions
   * Uses the sentence filters or explicit IDs to determine results.
   */
  async fetchOptions(queryOptions: QueryParams): Promise<{
    tags: any[];
    assignable_users: any[]; possible_transitions: any }> {
    const { exclude, include, notes, ordering, stateFilter, tagFilter, title, batchNameFilter } = queryOptions;

    return composerApi
      .composerSentenceAvailableOptionsRetrieve(batchNameFilter, exclude, include, notes, ordering, stateFilter, tagFilter, title)
      .then((response: any) => response.data);
  }

/**
 * Perform a bulk action on sentences.
 * Ensures correct parameter order even if API changes.
 * @param queryOptions - The filters or selection criteria.
 * @param bulkAction - The action to perform (e.g., assign user, add tag).
 */
async performBulkAction(queryOptions: QueryParams, bulkAction: BulkAction): Promise<{ message: string }> {
  const { exclude, include, notes, ordering, stateFilter, tagFilter, title, batchNameFilter } = queryOptions;

  const params = {
    batchName: batchNameFilter,
    exclude,
    include,
    notes,
    ordering,
    state: stateFilter,
    tags: tagFilter,
    title,
    bulkAction
  };

  return composerApi
    .composerSentenceBulkActionCreate(
      params.batchName,
      params.exclude,
      params.include,
      params.notes,
      params.ordering,
      params.state,
      params.tags,
      params.title,
      params.bulkAction
    )
    .then((response: any) => response.data);
}


  /**
   * Bulk assign a user to selected sentences.
   */
  async assignUserBulk(queryOptions: QueryParams, userId: number): Promise<{ message: string }> {
    return this.performBulkAction(queryOptions, { action: ActionEnum.AssignUser, user_id: userId });
  }

  /**
   * Bulk assign a tag to selected sentences.
   */
  async assignTagBulk(queryOptions: QueryParams, addTagIds: number[], removeTagIds: number[]): Promise<{ message: string }> {
    return this.performBulkAction(queryOptions, { action: ActionEnum.AssignTag, add_tag_ids: addTagIds, remove_tag_ids: removeTagIds });
  }

  /**
   * Bulk add a note to selected sentences.
   */
  async writeNoteBulk(queryOptions: QueryParams, noteText: string): Promise<{ message: string }> {
    return this.performBulkAction(queryOptions, { action: ActionEnum.WriteNote, note_text: noteText });
  }

  /**
   * Bulk change the status of selected sentences.
   */
  async changeStatusBulk(queryOptions: QueryParams, newStatus: string): Promise<{ message: string }> {
    return this.performBulkAction(queryOptions, { action: ActionEnum.ChangeStatus, new_status: newStatus });
  }

  /**
   * Bulk assign sentences to a population set.
   */
  async assignPopulationSetBulk(queryOptions: QueryParams, populationSetId: number): Promise<{ message: string }> {
    return this.performBulkAction(queryOptions, { action: ActionEnum.AssignPopulationSet, population_set_id: populationSetId });
  }

}

const sentenceService = new SentenceService()
export default sentenceService
