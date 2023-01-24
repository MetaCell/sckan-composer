import React from 'react'
import validator from "@rjsf/validator-ajv8";
import { UiSchema } from "@rjsf/utils";
// import { schema } from '../../schemas/sentenceSchema'

import { useParams } from "react-router-dom";
import {IChangeEvent, withTheme} from "@rjsf/core";
import { Box, Button} from '@mui/material';
import { Theme } from '@rjsf/mui'
import { editSentence } from '../../services/SentenceService';
import { createStatement } from '../../services/StatementService';
import { createNote } from '../../services/NoteService';

const Form = withTheme(Theme);

const log = (type:string) => console.log.bind(console, type);

const schema = require("../../schemas/SentenceWithDetails.json")

const uiSchema: UiSchema = {
  "notes":{
    "tags": {
    "ui:placeholder": 'Add Tags'
  },
  "newNote": {
    "ui:placeholder": 'Write your note...',
    "ui:widget": "textarea"
  }},
  "ui:submitButtonOptions": {
    "norender": true,
  }
};



const SentenceForm = (props:any) => {

  const { sentenceId } = useParams();
  
  const handleSubmit = async (event: IChangeEvent) => {
    const updatedTitle = event.formData.nlpSentence.articleTitle
    const tags = event.formData.nlpSentence.tags 
    try{
      await editSentence(Number(sentenceId), {title: updatedTitle})
      if(event.formData.knowledgeStatements) {
        for (const cs of event.formData.knowledgeStatements){
          await createStatement(cs, sentenceId)
        }
      }
      if(event.formData.notes) await createNote(event.formData.notes, sentenceId)
    }
    catch(error){
      return alert(error)
    }
  };

  let form: any
  
  return (
    <Box p={2}>
      <Box display='flex' justifyContent='flex-end'>
        <Button  variant='contained' onClick={(fd)=>form.submit(fd)}> Save changes</Button>
      </Box>
      <Form
          ref={(f) => {form = f}}
          schema={schema}
          uiSchema={uiSchema}
          formData={props.formData}
          validator={validator}
          onChange={log("changed")}
          onSubmit={handleSubmit}
          onError={log("errors")}
      />
    </Box>
  )
}

export default SentenceForm