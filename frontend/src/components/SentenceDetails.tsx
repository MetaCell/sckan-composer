import React, { useEffect, useState } from 'react'
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import { useParams } from "react-router-dom";
import SentenceForm from './Forms/SentenceForm';
import sentenceService from '../services/SentenceService'
import NoteForm from './Forms/NoteForm';
import TagForm from './Forms/TagForm';
import { Sentence } from '../apiclient/backend/api';
import { userProfile } from '../services/UserService'
import CheckDuplicates from "./CheckForDuplicates/CheckDuplicatesDialog"

const SentencesDetails = () => {
  const { sentenceId } = useParams()
  const [sentence, setSentence] = useState({} as Sentence)
  const [loading, setLoading] = useState(true)
  const [extraStatementForm, setExtraStatementForm] = useState<string[]>([])

  const doTransition = (transition: string) => {
    sentenceService.doTransition(sentence, transition).then((sentence: Sentence) => {
      setSentence(sentence)
    })
  }

  useEffect(() => {
    if(sentenceId) {
      sentenceService.getObject(sentenceId).then((sentence: Sentence) => {
        setSentence(sentence)
        if(sentence.owner && sentence.owner?.id !== userProfile.getUser().id) {
          if(window.confirm(`This sentence is assigned to ${sentence.owner.first_name}, assign to yourself?`)){
            sentenceService.save({...sentence, owner_id: userProfile.getUser().id}).then((sentence: Sentence) => {
              setSentence(sentence)
            })
          }
        }
      }).finally(() => {
        setLoading(false)
      })
    }
  }, [sentenceId]);

  if(loading) {
    return <div>Loading...</div>
  }

  const disabled = sentence.owner?.id !== userProfile.getUser().id

  return (
    <Grid p={12} container justifyContent='center'>
      <Grid item xl={12}>
        <Paper elevation={0} sx={{ padding: 8 }}>
          <Stack alignItems='center' spacing={4}>
            <Box textAlign='center'>
              <Typography variant='h3' marginBottom={1.5}>
                Sentence Details
              </Typography>
              <Typography variant='subtitle2'>
                Show the sentence with id {sentenceId} details here
              </Typography>
            </Box>
          </Stack>
        </Paper>
      </Grid>
      <Grid item xl={7}>
        <div>Last modified by {sentence?.owner?.first_name} on {sentence?.modified_date}</div>
        {
          !disabled && sentence?.available_transitions.map((transition) => <Button key={transition} onClick={() => doTransition(transition)}>{transition}</Button>)
        }
        <CheckDuplicates/>
        <SentenceForm data={sentence} disabled={disabled} format='full' setter={setSentence}/>
        <Button onClick={() => setExtraStatementForm((prev) => [...prev, ''])}>Add Statement</Button>
      </Grid>
      <Grid item xl={5}>
        <TagForm data={sentence.tags} extraData={{parentId: sentence.id, service: sentenceService}} setter={setSentence}/>
      </Grid>
      <Grid item xl={5}>
        <NoteForm extraData={{sentence_id: sentence.id}} setter={setSentence}/>
      </Grid>
    </Grid>
  )
}

export default SentencesDetails