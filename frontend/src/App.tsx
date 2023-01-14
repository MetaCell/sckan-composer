import React from 'react';
import theme from "./theme/Theme";
import { CssBaseline } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Box } from '@mui/material';
import Login from './components/Login';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline/>
      <Box
          height="100vh" 
          width="100vw" 
          overflow="auto" >
          <Box flex={1} display="flex" flexDirection='column' id='main-container'>
            <BrowserRouter>
              <Routes>
                <Route path='/' element={<Login/>}/>
              </Routes>
            </BrowserRouter>

          </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
