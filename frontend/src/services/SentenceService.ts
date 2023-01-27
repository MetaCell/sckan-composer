import { composerApi } from "./apis";
import { Sentence } from '../apiclient/backend';

export let sentence = (function () {
  var sentence: Sentence = {} as Sentence;

  return { // public interface
    setProfile: function (fetchedSentence: Sentence) {
      sentence = fetchedSentence;
    },
    getSentence: function (): Sentence {
      return sentence
    },
  };
})();

export async function getSentenceJsonSchema(): Promise<any> {
  return composerApi.composerSentenceJsonschemaRetrieve().then((response: any) => {
    if (response.status === 200) {
      return response.data
    } else {
      console.log("Error")
    }
  })
}

export async function sentenceRetrieve(id: number): Promise<any> {
  return composerApi.composerSentenceRetrieve(id).then((response: any) => {
    if (response.status === 200) {
      return response.data
    } else {
      console.log("Error")
    }
  })
}

export async function editSentence(id: number, patchedSentence: any): Promise<any> {
  const response = await composerApi.composerSentencePartialUpdate(id, patchedSentence)
  return response.data
}

