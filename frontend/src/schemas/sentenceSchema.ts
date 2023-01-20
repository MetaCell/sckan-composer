import { RJSFSchema } from "@rjsf/utils";
import { Sentence } from "../apiclient/backend";

export const schema: RJSFSchema = {
  title: "",
  type: "object",
  properties: {
    knowledgeStatements:{
        title:'Knowledge statements',
        type:'array',
        items:{
            type: 'object',
            properties:{
                knowledgeStatement:{
                    title: '',
                    type:'string',
                },
                details:{
                    title:'Statement Details',
                    type:'object',
                    properties:{
                        species:{
                            title:'Species',
                            type: "array",
                            uniqueItems: true, 
                            items: {
                                type: "string",
                                enum: ['Human', 'Pig', 'Other species'],
                            },
                        },
                        biologicalSex:{
                            title:'Biological Sex',
                            type: 'string'
                        },
                        apinatomyModel:{
                            title:'Apinatomy Model Name',
                            type:'string'
                        },
                        circuitType:{
                            title:'Circuit Type',
                            type:'array',
                            items:{
                                type:'string',
                                enum:['Sensory', 'Motor', 'Intrinsic', 'Projection', 'Anaxonic']
                            }
                        },
                        laterality:{
                            title:'Laterality',
                            type:'array',
                            items:{
                                type:'string',
                                enum:['IPSI', 'Contrat', 'Bi']
                            }
                        },
                        ansDivision:{
                            title:'ANS Division',
                            type:'array',
                            items:{
                                type:'string',
                                enum:['division 1', 'division 2', 'division 3']
                            }
                        }
                    }
                }
            }
        },
    },
    nlpSentence:{
        title:'NLP Sentence',
        properties:{
            text:{type:'string', readOnly:true, title:''},
            articleTitle:{type:'string', title:'Article Title'},
            pmcid:{title:'PMID (PubMed identifier)', type:'string', readOnly:true}
        }
    },
    notes:{
        title:'Notes',
        properties:{
            tags:{
                title:'',
                type: "array",
                uniqueItems: true, 
                items: {
                    type: "string",
                    enum: ['Curation team', 'Reviewers', 'Other tag'],
                  },
            },
            newNote:{
                title:'',
                type:'string'
            }
        }
    }
  }
};
