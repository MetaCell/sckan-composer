import { composerApi } from "./apis";
import { PaginatedSentenceList, Sentence } from '../apiclient/backend';
import { AbstractService } from "./AbstractService";
import { QueryParams } from "../redux/sentenceSlice";


class SentenceService extends AbstractService {
  async save(sentence: Sentence) {
    if (!sentence.id) {
      return composerApi.composerSentenceCreate(sentence).then((response: any) => response.data)
    }
    else {
      return composerApi.composerSentenceUpdate(sentence.id, sentence).then((response: any) => response.data)
    }
  }
  async getObject(id: string): Promise<Sentence> {
    return composerApi.composerSentenceRetrieve(Number(id)).then((response: any) => response.data)
  }
  async doTransition(sentence: Sentence, transition: string): Promise<Sentence> {
    return composerApi.composerSentenceDoTransitionCreate(sentence.id, transition, sentence).then((response: any) => response.data)
  }
  async addTag(id: number, tagId: number): Promise<Sentence> {
    return composerApi.composerSentenceAddTagCreate(id, tagId).then((response: any) => response.data)
  }
  async removeTag(id: number, tagId: number): Promise<Sentence> {
    return composerApi.composerSentenceDelTagCreate(id, tagId).then((response: any) => response.data)
  }
  async getList(queryOptions: QueryParams): Promise<PaginatedSentenceList> {
    const { exclude, limit, ordering, index, title, stateFilter, tagFilter } = queryOptions
    return composerApi.composerSentenceList(exclude, limit, undefined, index, ordering, stateFilter, tagFilter, title).then((res: any) => res.data)
  }
}

const sentenceService = new SentenceService()
export default sentenceService
