import { composerApi } from "./apis";
import { PaginatedSentenceList, PatchedSentence, Sentence} from '../apiclient/backend';
import { AbstractService } from "./AbstractService";
import { QueryParams } from "../redux/sentenceSlice";
import { checkSentenceOwnership} from "../helpers/ownershipAlert";


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
  async doTransition(sentence: Sentence, transition: string): Promise<Sentence> {
    return composerApi.composerSentenceDoTransitionCreate(sentence.id, transition, sentence).then((response: any) => response.data)
  }
  // @ts-ignore
  async addTag(id: number, tagId: number, onCancel: () => void = () => {}): Promise<string> {
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
  async removeTag(id: number, tagId: number, onCancel: () => void = () => {}): Promise<string> {
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
    const { exclude, include, limit, ordering, index, title, stateFilter, tagFilter } = queryOptions
    return composerApi.composerSentenceList(exclude, include, limit, undefined, index, ordering, stateFilter, tagFilter, title).then((res: any) => res.data)
  }
  async assignOwner(id: number, patchedSentence?: PatchedSentence): Promise<Sentence> {
    return composerApi.composerSentenceAssignOwnerPartialUpdate(id, patchedSentence).then((response: any) => response.data);
  }
}

const sentenceService = new SentenceService()
export default sentenceService
