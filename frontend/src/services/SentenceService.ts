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


export async function retrieveSentence(id:number): Promise<any> {
    try{
        const response = await composerApi.composerSentenceRetrieve(id)
        //sentence.setProfile(response.data)
        return response.data
    } catch (error){
        return error
    }
}

export async function editSentence(id:number,patchedSentence:any): Promise<any>{
    const response = await composerApi.composerSentencePartialUpdate(id, patchedSentence) 
    return response.data
}


