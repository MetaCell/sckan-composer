import React, { useEffect, useState} from 'react'
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import { useParams } from "react-router-dom";
import SentenceForm from './Forms/SentenceForm';
import { retrieveSentence } from '../services/SentenceService';
import { Sentence } from '../apiclient/backend';

const SentencesDetails = () => {
  const { sentenceId } = useParams();
  const [sentence, setSentence] = useState<Sentence>()

  const fetchSentence = async (id: number)=> {
    const response = await retrieveSentence(id)
    setSentence(response)
  }
  
  useEffect(() => {
    fetchSentence(Number(sentenceId))
  }, [])
  
  const formPrefilledData = {
    nlpSentence:{
      text: sentence?.text,
      pmcid: sentence?.pmcid
    },
    // knowledgeStatements:[
    //   {
    //     knowledgeStatement: 'hello',
    //     details: 'tengo detalles'
    //   }
    // ]
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
      <Grid item xl={12}>
        <SentenceForm formData={formPrefilledData}/>
      </Grid>
    </Grid>
  )
}

export default SentencesDetails