import React from 'react'
import validator from "@rjsf/validator-ajv8";
import { UiSchema } from "@rjsf/utils";
import { useParams } from "react-router-dom";
import {IChangeEvent, withTheme} from "@rjsf/core";
import { Box, Button} from '@mui/material';
import { Theme } from '@rjsf/mui'
import { hiddenWidget } from '../../helpers/helpers';

const Form = withTheme(Theme);

const log = (type:string) => console.log.bind(console, type);

const schema = require("../../schemas/Note.json")

const excludedFields = ["connectivity_statement","id", "sentence", "user","created" ]

const uiSchema: UiSchema = {
    "ui:submitButtonOptions": {
      "submitText": 'Send',
    },
    ...hiddenWidget(excludedFields),
    "note":{
        "ui:widget":"textarea"
    }
  };

const NoteForm = () => {
    
    const handleSubmit = async (event: IChangeEvent) => {
      console.log(event.formData)
    };
    
    return (
      <Box p={2}>
        <Form
        schema={schema}
        validator={validator}
        uiSchema={uiSchema}
        onSubmit={(fd)=>handleSubmit(fd)}
        />
      </Box>
    )
}

export default NoteForm