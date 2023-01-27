import React from 'react'
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography';
import logo from '../assets/logo.svg'
import Grid from '@mui/material/Grid';

import { Link } from 'react-router-dom'

import { logout } from '../services/UserService'
import { userProfile } from '../services/UserService'

const Login = () => {

  const handleClick = async () => {
    await logout();
    userProfile.clearProfile();
    window.location.href = 'https://orcid.org/signout';
  }

  const profile = userProfile.getProfile();

  return (
    <Grid pt={12} container justifyContent='center'>
      <Paper elevation={0} sx={{ padding: 8 }}>
        <Stack alignItems='center' spacing={4}>
          <Box component='img' display='block' src={logo} alt='Composer logo' />
          <Box textAlign='center'>
            <Typography variant='h3' marginBottom={1.5}>
              You are logged in!
            </Typography>
            <Typography variant='subtitle2'>
              Welcome back {profile?.user?.first_name}! Please enter your details.
            </Typography>
          </Box>
          <Link to="/sentence/1/">Open details of Sentence with id 1</Link>
          <Button variant='contained' fullWidth onClick={handleClick}>Logout</Button>
        </Stack>
      </Paper>
    </Grid>
  )
}

export default Login