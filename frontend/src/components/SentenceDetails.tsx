import React, { useEffect, useState } from 'react'
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import { useParams } from "react-router-dom";
import SentenceForm from './Forms/SentenceForm';
import { sentenceRetrieve, getSentenceJsonSchema } from '../services/SentenceService';
import { Sentence } from '../apiclient/backend';
import NoteForm from './Forms/NoteForm';
import StatementForm from './Forms/StatementForm';


const SentencesDetails = () => {
  const { sentenceId } = useParams();
  const [sentence, setSentence] = useState<any>()
  const [extraStatementForm, setExtraStatementForm] = useState<string[]>([])

  const fetchSentence = async (id: number) => {
    if(id<1 || isNaN(id)){
      setSentence({})
    } else {
      sentenceRetrieve(id).then((response) => setSentence(response))
    }
  }

  useEffect(() => {
    fetchSentence(Number(sentenceId))
  }, [])

  if(!sentence) {
    return <div>Loading...</div>
  }

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
        <SentenceForm data={sentence} format='full' />
        <Button onClick={() => setExtraStatementForm((prev) => [...prev, ''])}>Add Statement</Button>
      </Grid>
      <Grid item xl={5}>
        <NoteForm />
      </Grid>
    </Grid>
  )
}

export default SentencesDetails