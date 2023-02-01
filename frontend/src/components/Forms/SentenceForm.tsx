import React from 'react'
import { Box } from '@mui/material'
import { FormBase } from './FormBase'
import { jsonSchemas } from '../../services/JsonSchema'
import sentenceService from '../../services/SentenceService'

const SentenceForm = (props: any) => {
  const { data, format, setter } = props
  const { schema, uiSchema } = jsonSchemas.getSentenceSchema()

  const uiFields = format === 'small'
    ? ["title", "text"]
    : undefined

  // TODO: set up the widgets for the schema

  return (
    <Box p={2}>
      <FormBase
        data={data}
        service={sentenceService}
        schema={schema}
        setter={setter}
        uiSchema={uiSchema}
        uiFields={uiFields}
      />
    </Box>
  )
}

export default SentenceForm