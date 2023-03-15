import React, {useEffect, useState} from 'react'
import { Box } from '@mui/material'
import { FormBase } from './FormBase'
import { jsonSchemas } from '../../services/JsonSchema'
import noteService from '../../services/NoteService'
import Button from "@mui/material/Button";
import {UiSchema} from "@rjsf/utils";
import CustomTextArea from "../Widgets/CustomTextArea";
import SendIcon from '@mui/icons-material/Send';
import {vars} from "../../theme/variables";
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import MessageIcon from '@mui/icons-material/Message';
import Typography from "@mui/material/Typography";
import {Note} from "../../apiclient/backend";
import {timeAgo} from "../../helpers/helpers";
import {useDispatch} from "react-redux";

const TimeLineIcon = () => {
  return <Box sx={{
    padding: 8,
    background: '#F2F4F7',
    borderRadius: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: 30,
    width: 30,
  }}>
    <MessageIcon sx={{fontSize: 16}} />
  </Box>
}
const NoteForm = (props: any) => {
  const { setRefresh, extraData } = props
  const { schema, uiSchema } = jsonSchemas.getNoteSchema()
  const [data, setData] = useState({})

  const clearNoteForm = () => {
    setData({})
    setRefresh(true)
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
    <FormBase
      data={data}
      service={noteService}
      schema={customSchema}
      uiSchema={customUiSchema}
      uiFields={uiFields}
      enableAutoSave={false}
      clearOnSave={true}
      setter={clearNoteForm}
      extraData={extraData}
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

  )
}

export default NoteForm
