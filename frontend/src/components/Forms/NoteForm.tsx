import React from 'react'
import { Box } from '@mui/material'
import { FormBase } from './FormBase'
import { jsonSchemas } from '../../services/JsonSchema'
import noteService from '../../services/NoteService'


const NoteForm = (props: any) => {
  const { schema, uiSchema } = jsonSchemas.getNoteSchema()
  const [data, setData] = React.useState({})

  const clearNoteForm = () => setData({})

  // TODO: set up the widgets for the schema
  const uiFields = ["note",]

  return (
    <Box p={2}>
      <FormBase
        data={data}
        service={noteService}
        setter={clearNoteForm}
        schema={schema}
        uiSchema={uiSchema}
        uiFields={uiFields}
        {...props}
      />
    </Box>
  )
}

export default NoteForm