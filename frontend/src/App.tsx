import React from "react";
import theme from "./theme/Theme";
import { ThemeProvider } from "@mui/material/styles";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import Toolbar from "@mui/material/Toolbar";
import Dashboard from "./components/Dashboard";
import SentenceDetails from "./Pages/SentenceDetails";
import StatementDetails from "./Pages/StatementDetails";
import Topbar from "./components/Topbar";
import Sidebar from "./components/Sidebar";
import StatementList from "./Pages/StatementList";
import SentenceList from "./Pages/SentenceList";
import { userProfile } from "./services/UserService";
import { useAppDispatch } from "./redux/hooks";
import { setFilters as setStatementFilters } from "./redux/statementSlice";
import { setFilters as setSentenceFilters } from "./redux/sentenceSlice";
import { ComposerSentenceListStateEnum } from "./apiclient/backend";

const PageSelect = () => {
  const user = userProfile.getProfile();

  if (user.is_triage_operator) {
    return <SentenceList />;
  } else if (user.is_curator || user.is_reviewer) {
    return <StatementList />;
  } else {
    return <Dashboard />;
  }
};

function App() {
  const dispatch = useAppDispatch();

  if (userProfile.isSignedIn()) {
    const user = userProfile.getProfile();

    const defaultStatementStateFilter = []
    const defaultSentenceStateFilter = [
      ComposerSentenceListStateEnum.ComposeLater, ComposerSentenceListStateEnum.ComposeNow,
      ComposerSentenceListStateEnum.NeedsFurtherReview, ComposerSentenceListStateEnum.ReadyToCompose
    ]
    if (user.is_curator) {
      defaultStatementStateFilter.push("compose_now")
    }

    if (user.is_reviewer) {
      defaultStatementStateFilter.push("to_be_reviewed")
    }

    if (defaultStatementStateFilter.length > 0) {
      dispatch(setStatementFilters({ stateFilter: defaultStatementStateFilter }));
    }
    dispatch(setSentenceFilters({ stateFilter: defaultSentenceStateFilter }));

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
                <Route path="/" element={<PageSelect />} />
                <Route
                  path="/sentence/:sentenceId/"
                  element={<SentenceDetails />}
                />
                <Route path="/statement" element={<StatementList />} />
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
