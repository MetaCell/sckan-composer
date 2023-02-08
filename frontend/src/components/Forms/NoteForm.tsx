import React from 'react'
import { Box } from '@mui/material'
import { FormBase } from './FormBase'
import { jsonSchemas } from '../../services/JsonSchema'
import noteService from '../../services/NoteService'


const NoteForm = (props: any) => {
  const { setter } = props
  const { schema, uiSchema } = jsonSchemas.getNoteSchema()
  const [data, setData] = React.useState({})

  const clearNoteForm = (newData: any) => {
    setData({})
    setter(newData)
  }

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
        enableAutoSave={false}
        clearOnSave={true}
        {...props}
      />
    </Box>
  )
}

export default NoteForm