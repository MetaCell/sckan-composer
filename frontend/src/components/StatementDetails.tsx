import React, { useEffect, useState} from 'react'
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import { useParams } from "react-router-dom";
import StatementForm from './Forms/StatementForm';
import { statementRetrieve, getStatementJsonSchema } from '../services/StatementService';
import { sentenceRetrieve,  } from '../services/SentenceService';
import { ConnectivityStatement, Sentence } from '../apiclient/backend';
import NoteForm from './Forms/NoteForm';
import SentenceForm from './Forms/SentenceForm';


const StatementDetails = () => {
  const { statementId } = useParams();
  const [statement, setStatement] = useState<any>()
  const [sentence, setSentence] = useState<any>()
  
  const sentenceExcludedFields = ['tags', 'available_transitions', 'state', 'doi']
  
  const fetchStatement = async (id: number) => {
    if(id<1 || isNaN(id)){
      getStatementJsonSchema().then((response) => {
        setStatement(response)
      })
    } else {
      statementRetrieve(id).then((response) => {
        sentenceRetrieve(response.sentence_id).then((sentenceResponse) => {
          setStatement(response)
          setSentence(sentenceResponse)
        })
      })
    }
  }
  
  useEffect(() => {
    fetchStatement(Number(statementId))
  }, [])

  return (
    <Grid p={12} container justifyContent='center'>
      <Grid item xl={12}>
      <Paper elevation={0} sx={{ padding: 8 }}>
        <Stack alignItems='center' spacing={4}>
          <Box textAlign='center'>
            <Typography variant='h3' marginBottom={1.5}>
              Statement Details
            </Typography>
            <Typography variant='subtitle2'>
              Show the statement with id {statementId} details here
            </Typography>
          </Box>
        </Stack>
      </Paper>
      </Grid>
      <Grid item xl={7}>
        <StatementForm data={statement} format='full' />
        <SentenceForm data={sentence} format='small' />
      </Grid>
      <Grid item xl={5}>
        <NoteForm/>
      </Grid>
    </Grid>
  )
}

export default StatementDetails