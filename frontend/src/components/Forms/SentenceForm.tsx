import React from 'react'
import validator from "@rjsf/validator-ajv8";
import { UiSchema } from "@rjsf/utils";
import {IChangeEvent, withTheme} from "@rjsf/core";
import { Box, Button, MenuItem, Select} from '@mui/material';
import { Theme } from '@rjsf/mui'
import { hiddenWidget } from '../../helpers/helpers';

const Form = withTheme(Theme);

const log = (type:string) => console.log.bind(console, type);

const sentenceSchema = require("../../schemas/SentenceWithDetails.json")

const excludedFields = [ 'id', 'modified_date', 'owner', 'pmcid', 'pmcid_uri', 'pmid_uri']
const statementExcludedFields =['id', 'destination', 'destination_type', 'modified_date', 'origin', 'owner', 'path', 'sentence', 'tags', 'state', 'available_transitions']

const uiSchema: UiSchema = {
  "ui:submitButtonOptions": {
    "norender": true,
  },
  ...hiddenWidget(excludedFields),
  'ui:order':['connectivity_statements', 'text', 'title', 'pmid', 'state','doi','tags','available_transitions',...excludedFields ],
  "connectivity_statements":{
    "items":{ ...hiddenWidget(statementExcludedFields),
      "ui:order":["knowledge_statement", "species", "biological_sex", "apinatomy_model", "circuit_type", "laterality", "ans_division", ...statementExcludedFields]
    },
  },
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