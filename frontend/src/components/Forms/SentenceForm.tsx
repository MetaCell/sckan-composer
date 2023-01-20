import React from 'react'
import validator from "@rjsf/validator-ajv8";
import Form from '@rjsf/mui';
import { UiSchema } from "@rjsf/utils";
import { schema } from '../../schemas/sentenceSchema'
import {IChangeEvent} from "@rjsf/core";

const log = (type:string) => console.log.bind(console, type);


const uiSchema: UiSchema = {
  "notes":{
    "tags": {
    "ui:placeholder": 'Add Tags'
  },
  "newNote": {
    "ui:placeholder": 'Write your note...',
    "ui:widget": "textarea"
  }},
};

const SentenceForm = (props:any) => {
  
  const handleSubmit = (event: IChangeEvent) => {
    console.log(event.formData)
};
  
  return (
    <Form schema={schema}
        uiSchema={uiSchema}
        formData={props.formData}
        validator={validator}
        onChange={log("changed")}
        onSubmit={fd=>handleSubmit(fd)}
        onError={log("errors")}
    />
  )
}

export default SentenceForm