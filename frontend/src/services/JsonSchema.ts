import {composerApi} from './apis'

export let jsonSchemas = (function () {
  let sentenceSchema:any = null;
  let connectivityStatementSchema:any = null;
  let noteSchema:any = null;
  let tagSchema:any = null;
  let viaSchema:any = null;

  return { // public interface
    initSchemas: async function () {
      return composerApi.composerJsonschemasRetrieve().then((resp:any) => {
        sentenceSchema = resp.data.Sentence
        connectivityStatementSchema = resp.data.ConnectivityStatement
        noteSchema = resp.data.Note
        tagSchema = resp.data.Tag
        viaSchema = resp.data.Via
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
    getTagSchema: function () {
      return tagSchema
    },
    getViaSchema: function () {
      return viaSchema
    },
  };
})();
