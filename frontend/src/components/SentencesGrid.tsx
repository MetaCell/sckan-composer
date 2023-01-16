import React from 'react'
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';

const SentencesGrid = () => {
  return (
    <Grid pt={12} container justifyContent='center'>
      <Paper elevation={0} sx={{ padding: 8 }}>
        <Stack alignItems='center' spacing={4}>
          <Box textAlign='center'>
            <Typography variant='h3' marginBottom={1.5}>
              Sentences Grid
            </Typography>
            <Typography variant='subtitle2'>
              Show the sentences grid here
            </Typography>
          </Box>
        </Stack>
      </Paper>
    </Grid>
  )
}

export default SentencesGrid