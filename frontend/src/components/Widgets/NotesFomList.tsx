import React, {useEffect, useState} from 'react'
import { Box } from '@mui/material'
import noteService from '../../services/NoteService'
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import MessageIcon from '@mui/icons-material/Message';
import Typography from "@mui/material/Typography";
import {Note} from "../../apiclient/backend";
import {timeAgo} from "../../helpers/helpers";
import NoteForm from "../Forms/NoteForm";
import { useGreyBgContainer } from '../../styles/styles';
import { useTheme } from "@mui/system";

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
const NoteDetails = (props: any) => {
  const { extraData } = props
  const [noteList, setNoteList] = useState<Note[]>([])
  const [refresh, setRefresh] = useState(false)

  const theme = useTheme()
  const greyBgContainer = useGreyBgContainer(theme)

  useEffect(() => {
    const { connectivity_statement_id, sentence_id } = extraData
    if (connectivity_statement_id || sentence_id) {
      noteService.getNotesList(connectivity_statement_id, undefined,undefined, sentence_id).then(result => {
        setNoteList(result?.results)
        setRefresh(false)
      })
    }
  }, [extraData?.connectivity_statement_id, extraData?.sentence_id, refresh, extraData])

  return (
    <Box display='flex' flexDirection='column' >
      <Box sx={{
        ...greyBgContainer,
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
        <NoteForm setRefresh={setRefresh} extraData={extraData} />
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
            <TimelineItem key={index}>
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

export default NoteDetails
