import {composerApi} from './apis'

export let jsonSchemas = (function () {
  let sentenceSchema:any = null;
  let connectivityStatementSchema:any = null;
  let noteSchema:any = null;

  return { // public interface
    initSchemas: async function () {
      return composerApi.composerSentenceJsonschemaRetrieve().then((resp:any) => {
        sentenceSchema = resp.data.serializer
        return composerApi.composerConnectivityStatementJsonschemaRetrieve().then((resp:any) => {  
          connectivityStatementSchema = resp.data.serializer
          return composerApi.composerNoteJsonschemaRetrieve().then((resp:any) => {
            noteSchema = resp.data.serializer
          })
        })
      })
    },
    getSentenceSchema: function () {
      return sentenceSchema
    },
    getConnectivityStatementSchema: function () {
      return connectivityStatementSchema
    },
    getNoteSchema: function () {
      return noteSchema
    },
  };
})();
