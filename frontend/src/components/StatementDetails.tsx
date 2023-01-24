import React, { useEffect, useState} from 'react'
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import { useParams } from "react-router-dom";
import StatementForm from './Forms/StatementForm';
import { retrieveStatement } from '../services/StatementService';
import { ConnectivityStatement } from '../apiclient/backend';
import NoteForm from './Forms/NoteForm';

const StatementDetails = () => {
  const { statementId } = useParams();
  const [statement, setStatement] = useState<ConnectivityStatement>()

  const fetchSentence = async (id: number)=> {
    const response = await retrieveStatement(id)
    setStatement(response)
  }
  
  useEffect(() => {
    fetchSentence(Number(statementId))
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
        <StatementForm formData={statement}/>
      </Grid>
      <Grid item xl={5}>
        <NoteForm/>
      </Grid>
    </Grid>
  )
}

export default StatementDetails