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
  const { setter, extraData } = props
  const { schema, uiSchema } = jsonSchemas.getNoteSchema()
  const [data, setData] = useState({})
  const [noteList, setNoteList] = useState([])

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

  useEffect(() => {
    if (extraData?.sentence_id) {
      noteService.getNotesList(undefined, extraData?.sentence_id).then(result => {
        setNoteList(result?.results)
      })
    }
  }, [extraData?.sentence_id])


  return (
    <Box display='flex' flexDirection='column' >
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

      <Timeline sx={{
        "& .MuiTimelineItem-root": {
          "&:before": {
            display: 'none'
          }
        }
      }}>
        {
          noteList?.map((note: Note, index: number) =>
            <TimelineItem>
              <TimelineSeparator>
                <TimeLineIcon />
                {
                  index !== noteList?.length - 1 &&  <TimelineConnector sx={{margin: '8px 0'}} />
                }
              </TimelineSeparator>
              <TimelineContent>
                <Typography variant="h6">
                  {note?.user}
                </Typography>
                <Typography fontSize={12}>
                  {
                    timeAgo(note?.created_at)
                  }
                </Typography>
                <Typography variant="subtitle2" fontSize={14}>{note?.note}</Typography>
              </TimelineContent>
            </TimelineItem>
          )
        }
      </Timeline>
    </Box>

  )
}

export default NoteForm
