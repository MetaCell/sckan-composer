import React, { useEffect, useState} from 'react'
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import { useParams } from "react-router-dom";
import StatementForm from './Forms/StatementForm';
import { statementRetrieve } from '../services/StatementService';
import NoteForm from './Forms/NoteForm';


const StatementDetails = () => {
  const { statementId } = useParams();
  const [statement, setStatement] = useState<any>()
   
  const fetchStatement = async (id: number) => {
    if(id<1 || isNaN(id)){
      setStatement({})
    } else {
      statementRetrieve(id).then((response) => {
        setStatement(response)
      })
    }
  }
  
  useEffect(() => {
    fetchStatement(Number(statementId))
  }, [statementId])

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
            <Typography variant='subtitle2'>
              Sentence: {statement?.sentence.title}
            </Typography>
            <Typography variant='subtitle2'>
              {statement?.sentence.text}
            </Typography>
          </Box>
        </Stack>
      </Paper>
      </Grid>
      <Grid item xl={7}>
        <StatementForm data={statement} format='full' />
      </Grid>
      <Grid item xl={5}>
        <NoteForm/>
      </Grid>
    </Grid>
  )
}

export default StatementDetails