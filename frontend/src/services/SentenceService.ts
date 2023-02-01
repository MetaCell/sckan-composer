import { composerApi } from "./apis";
import { Sentence } from '../apiclient/backend/api';
import { AbstractService } from "./AbstractService";


class SentenceService extends AbstractService {
  async save(object: Sentence) {
    return composerApi.composerSentencePartialUpdate(object.id, object).then((response: any) => response.data)
  }
  async getObject(id: string): Promise<Sentence> {
    return composerApi.composerSentenceRetrieve(Number(id)).then((response: any) => response.data)
  }
}

export async function editSentence(id: number, patchedSentence: any): Promise<any> {
  const response = await composerApi.composerSentencePartialUpdate(id, patchedSentence)
  return response.data
}

export default new SentenceService()
