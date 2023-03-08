import React from 'react'
import { Box } from '@mui/material'
import { FormBase } from './FormBase'
import { jsonSchemas } from '../../services/JsonSchema'
import noteService from '../../services/NoteService'
import Button from "@mui/material/Button";
import {UiSchema} from "@rjsf/utils";
import CustomTextArea from "../Widgets/CustomTextArea";
import SendIcon from '@mui/icons-material/Send';
import {vars} from "../../theme/variables";


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

  const customUiSchema: UiSchema = {
    ...uiSchema,
    note: {
      "ui:widget": CustomTextArea,
      "ui:options": {
        placeholder: "Write your note",
        rows: 5,
      }
    },
  };


  return (
    <Box sx={{
      background: '#F2F4F7',
      borderRadius: '12px',
      padding: '0 8px 8px !important',
      textAlign: 'center',
      "& .MuiGrid-item":
        {
          paddingTop: 0
        },
      "& .MuiInputBase-root": {
        background: '#fff',
        borderRadius: '12px'
      }
    }}>
      <FormBase
        data={data}
        service={noteService}
        setter={clearNoteForm}
        schema={customSchema}
        uiSchema={customUiSchema}
        uiFields={uiFields}
        enableAutoSave={false}
        clearOnSave={true}
        {...props}
      >
        <Button
          type="submit"
          className="btn btn-primary"
          sx={{
            padding: 0,
            color: vars.darkBlue,

            "&:hover": {
              background: 'transparent',
              color: vars.mediumBlue
            }
          }}
          startIcon={<SendIcon />}
        >
          Send
        </Button>
      </FormBase>
    </Box>
  )
}

export default NoteForm
