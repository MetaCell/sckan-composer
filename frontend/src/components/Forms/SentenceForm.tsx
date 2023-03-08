import React from 'react'
import { Box } from '@mui/material'
import { FormBase } from './FormBase'
import { jsonSchemas } from '../../services/JsonSchema'
import sentenceService from '../../services/SentenceService'
import {UiSchema} from "@rjsf/utils";
import CustomTextArea from "../Widgets/CustomTextArea";
import CustomTextField from "../Widgets/CustomTextField";

const SentenceForm = (props: any) => {
  const { format } = props
  const { schema, uiSchema } = jsonSchemas.getSentenceSchema()

  const uiFields = format === 'small'
    ? ["title"]
    : undefined

  // TODO: set up the widgets for the schema

  const customUiSchema: UiSchema = {
    ...uiSchema,
    title: {
      "ui:widget": CustomTextField,
      "ui:options": {
        label: 'Article Title',
        placeholder: "Enter Article Title",
      }
    },
  };


  return (
    <Box p={2}>
      <FormBase
        service={sentenceService}
        schema={schema}
        uiSchema={customUiSchema}
        uiFields={uiFields}
        enableAutoSave={true}
        {...props}
      />
    </Box>
  )
}

export default SentenceForm
