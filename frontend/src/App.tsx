import React from "react";
import theme from "./theme/Theme";
import { ThemeProvider } from "@mui/material/styles";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import Toolbar from "@mui/material/Toolbar";
import Dashboard from "./components/Dashboard";
import SentenceDetails from "./components/SentenceDetails";
import StatementDetails from "./components/StatementDetails";
import Topbar from "./components/Topbar";
import Sidebar from "./components/Sidebar";
import { userProfile } from "./services/UserService";

function App() {
  if (userProfile.isSignedIn()) {
    return (
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <Box height="100vh" width="100vw" overflow="auto" display="flex">
            <CssBaseline />
            <Topbar />
            <Sidebar />
            <Box component="main" flexGrow={1}>
              <Toolbar />
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route
                  path="/sentence/:sentenceId/"
                  element={<SentenceDetails />}
                />
                <Route
                  path="/statement/:statementId/"
                  element={<StatementDetails />}
                />
              </Routes>
            </Box>
          </Box>
        </ThemeProvider>
      </BrowserRouter>
    );
  } else {
    return <div />;
  }
}

export default App;
