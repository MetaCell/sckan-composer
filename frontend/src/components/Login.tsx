import React from 'react'
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography';
import logo from '../assets/logo.svg'
import Grid from '@mui/material/Grid';
import {login} from '../services/UserService'

const Login = () => {

  const handleClick =  async() =>{
    const path = await login()
    const domain = 'https://composer.sckan.dev.metacell.us'
    window.location.href = domain + path
  }
  return (
    <Grid pt={12} container justifyContent='center'>
            <Paper elevation={0} sx={{padding:8}}>
                <Stack  alignItems='center' spacing={4}>
                    <Box component='img' display='block' src={logo} alt='Composer logo' width='1rem' height='1.5rem'/>
                    <Box textAlign='center'>
                    <Typography variant='h3' marginBottom={1.5}>
                        Login to your account
                    </Typography>
                    <Typography variant='subtitle2'>
                        Welcome back! Please enter your details.
                    </Typography>
                    </Box>
                    <Button variant='contained' fullWidth onClick={handleClick}> Sign in with ORCID</Button>
                </Stack>
            </Paper>
    
    </Grid>
  )
}

export default Login