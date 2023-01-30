import React from 'react'
import { Box } from '@mui/material'
import { FormBase } from './FormBase'
import { jsonSchemas } from '../../services/JsonSchema'


const NoteForm = () => {
  const { schema, uiSchema } = jsonSchemas.getNoteSchema()

  // TODO: set up the widgets for the schema

  return (
    <Box p={2}>
      <FormBase
        data={{}}
        schema={schema}
        uiSchema={uiSchema}
      />
    </Box>
  )
}

export default NoteForm