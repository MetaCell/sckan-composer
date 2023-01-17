import React from 'react';
import theme from "./theme/Theme";
import { CssBaseline } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Box } from '@mui/material';
import Dashboard from './components/Dashboard';
import SentenceDetails from './components/SentenceDetails';
import { userProfile } from './services/UserService'


function App() {
  if(userProfile.isSignedIn()) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          height="100vh"
          width="100vw"
          overflow="auto" >
          <Box flex={1} display="flex" flexDirection='column' id='main-container'>
            <BrowserRouter>
              <Routes>
                <Route path='/' element={<Dashboard />} />
                <Route path='/sentence/:sentenceId/' element={<SentenceDetails />} />
              </Routes>
            </BrowserRouter>
          </Box>
        </Box>
      </ThemeProvider>
    )
  } else {
    return <div />
  }
}

export default App;
