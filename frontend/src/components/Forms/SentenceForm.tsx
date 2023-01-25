import React from 'react'
import validator from "@rjsf/validator-ajv8";
import { UiSchema } from "@rjsf/utils";
import {IChangeEvent, withTheme} from "@rjsf/core";
import { Box, Button, MenuItem, Select} from '@mui/material';
import { Theme } from '@rjsf/mui'
import { hiddenWidget } from '../../helpers/helpers';

const Form = withTheme(Theme);

const log = (type:string) => console.log.bind(console, type);

const sentenceSchema = require("../../schemas/Sentence.json")

const excludedFields:string[] = [ 
  'id', 'modified_date', 'owner', 'pmcid', 'pmcid_uri', 'pmid_uri'
]

const uiSchema: UiSchema = {
  "ui:submitButtonOptions": {
    "norender": true,
  },
  ...hiddenWidget(excludedFields),
  'ui:order':[ 'text', 'title', 'pmid', 'state','doi','tags','available_transitions',...excludedFields ],
};


const SentenceForm = (props:any) => {
  
  const handleSubmit = async (event: IChangeEvent) => {
    console.log(event.formData)
  };

  let form: any;
  
  return (
    <Box p={2}>
      {/* <Box display='flex' justifyContent='flex-end'>
        <Button  variant='contained' onClick={(fd)=>form.submit(fd)}> Save changes</Button>
      </Box> */}
      <Form
          ref={(f) => {form = f}}
          schema={sentenceSchema}
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