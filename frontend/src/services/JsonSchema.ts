import {composerApi} from './apis'

export let jsonSchemas = (function () {
  let sentenceSchema:any = null;
  let connectivityStatementSchema:any = null;
  let noteSchema:any = null;
  let tagSchema:any = null;
  let doiSchema:any = null;
  let viaSchema:any = null;
  let speciesSchema:any = null;

  return { // public interface
    initSchemas: async function () {
      return composerApi.composerJsonschemasRetrieve().then((resp:any) => {
        sentenceSchema = resp.data.Sentence
        connectivityStatementSchema = resp.data.ConnectivityStatement
        noteSchema = resp.data.Note
        tagSchema = resp.data.Tag
        doiSchema = resp.data.Doi
        viaSchema = resp.data.Via
        speciesSchema = resp.data.Specie
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
    getDoiSchema: function () {
      return doiSchema
    },
    getViaSchema: function () {
      return viaSchema
    },
    getSpeciesSchema: function () {
      return speciesSchema
    },
  };
})();
