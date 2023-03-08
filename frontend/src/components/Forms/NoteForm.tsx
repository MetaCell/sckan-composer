import React from 'react'
import { Box } from '@mui/material'
import { FormBase } from './FormBase'
import { jsonSchemas } from '../../services/JsonSchema'
import noteService from '../../services/NoteService'
import Button from "@mui/material/Button";


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
  const customSchema = {
    ...schema,
    "title": ""
  }

  return (
    <Box p={1} sx={{background: '#F2F4F7', borderRadius: '12px'}}>
      <FormBase
        data={data}
        service={noteService}
        setter={clearNoteForm}
        schema={customSchema}
        uiSchema={uiSchema}
        uiFields={uiFields}
        enableAutoSave={false}
        clearOnSave={true}
        {...props}
      >
        <Button
          type="submit"
          className="btn btn-primary"
        >
          salam
        </Button>
      </FormBase>
    </Box>
  )
}

export default NoteForm
