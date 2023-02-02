import React from 'react'
import { Box } from '@mui/material'
import { FormBase } from './FormBase'
import { jsonSchemas } from '../../services/JsonSchema'
import sentenceService from '../../services/SentenceService'

const SentenceForm = (props: any) => {
  const { format } = props
  const { schema, uiSchema } = jsonSchemas.getSentenceSchema()

  const uiFields = format === 'small'
    ? ["title", "text"]
    : undefined

  // TODO: set up the widgets for the schema

  return (
    <Box p={2}>
      <FormBase
        service={sentenceService}
        schema={schema}
        uiSchema={uiSchema}
        uiFields={uiFields}
        {...props}
      />
    </Box>
  )
}

export default SentenceForm