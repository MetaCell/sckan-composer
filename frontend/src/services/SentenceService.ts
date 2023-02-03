import { composerApi } from "./apis";
import { Sentence } from '../apiclient/backend/api';
import { AbstractService } from "./AbstractService";


class SentenceService extends AbstractService {
  async save(sentence: Sentence) {
    return composerApi.composerSentenceUpdate(sentence.id, sentence).then((response: any) => response.data)
  }
  async getObject(id: string): Promise<Sentence> {
    return composerApi.composerSentenceRetrieve(Number(id)).then((response: any) => response.data)
  }
  async doTransition(sentence: Sentence, transition: string) {
    return composerApi.composerSentenceDoTransitionCreate(sentence.id, transition, sentence).then((response: any) => response.data)
  }
}

const sentenceService = new SentenceService()
export default sentenceService
