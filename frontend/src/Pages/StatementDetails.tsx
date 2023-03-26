import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TabPanel from "../components/Widgets/TabPanel";
import { useParams } from "react-router-dom";
import StatementForm from "../components/Forms/StatementForm";
import statementService from "../services/StatementService";
import NoteForm from "../components/Forms/NoteForm";
import TagForm from "../components/Forms/TagForm";
import { ConnectivityStatement } from "../apiclient/backend";
import { Button } from "@mui/material";
import { userProfile } from "../services/UserService";
import CheckDuplicates from "../components/CheckForDuplicates/CheckDuplicatesDialog";
import ProofingTab from "../components/ProofingTab";
import {SentenceStateChip} from "../components/Widgets/StateChip";
import {formatDate, formatTime, SentenceLabels} from "../helpers/helpers";
import GroupedButtons from "../components/Widgets/CustomGroupedButtons";
import TriageStatementSection from "../components/TriageStatementSection/TriageStatementSection";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import SentenceForm from "../components/Forms/SentenceForm";
import sentenceService from "../services/SentenceService";
import Divider from "@mui/material/Divider";
import NoteDetails from "../components/Widgets/NotesFomList";

const StatementDetails = () => {
  const { statementId } = useParams();
  const [statement, setStatement] = useState({} as ConnectivityStatement);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  const doTransition = (transition: string) => {
    statementService
      .doTransition(statement, transition)
      .then((statement: ConnectivityStatement) => {
        setStatement(statement);
      });
  };

  useEffect(() => {
    if (statementId) {
      statementService
        .getObject(statementId)
        .then((statement: ConnectivityStatement) => {
          setStatement(statement);
          if (
            statement.owner &&
            statement.owner?.id !== userProfile.getUser().id
          ) {
            if (
              window.confirm(
                `This statement is assigned to ${statement.owner.first_name}, assign to yourself?`
              )
            ) {
              statementService
                .save({ ...statement, owner_id: userProfile.getUser().id })
                .then((statement: ConnectivityStatement) => {
                  setStatement(statement);
                });
            }
          }
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [statementId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Grid p={6} container>
      <Grid item xs={12} mb={4}>
        <Grid container>
          <Grid item xs={12} md={6}>
            <Box>
              <Typography variant="h3" mb={1}>
                Statement Details #{statementId}{" "}
                <span>
                  <SentenceStateChip
                    key={statement?.state}
                    value={statement?.state}
                  />
                </span>
              </Typography>
              <span>
                Last Edited on {formatDate(statement?.modified_date)},{" "}
                {formatTime(statement?.modified_date)}
              </span>
            </Box>
          </Grid>
          <Grid item xs={12} md={6} display="flex" justifyContent="flex-end">
            <Button>status</Button>
          </Grid>
        </Grid>
      </Grid>

      <Grid item xl={12} mb={4} width={1}>
        <Box>
          <Tabs
            value={activeTab}
            variant="standard"
            onChange={(e, i: number) => setActiveTab(i)}
            sx={{
              borderBottom: '1px solid #EAECF0',
            }}
          >
            <Tab label="Distillation" />
            <Tab label="Proofing" />
          </Tabs>
        </Box>
      </Grid>

      <Grid item xs={12}>
        <Grid container spacing={1}>
          <Grid item xs={12} md={7}>
            <TabPanel value={activeTab} index={0}>
              <Paper
                sx={{
                  border: 0,
                  boxShadow: "none",
                }}
              >
                <Grid container p={3} mb={2}>
                  <Grid item xs={12}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      sx={{
                        "& .MuiButtonBase-root": {
                          padding: 0,
                        },
                      }}
                    >
                      <Typography variant="h5" mb={1}>
                        Knowledge Statements
                      </Typography>
                    </Stack>
                  </Grid>
                </Grid>
              </Paper>
              <SentenceForm
                data={statement.sentence}
                format="small"
              />
            </TabPanel>
            <TabPanel value={activeTab} index={1}>
              <ProofingTab statement={statement} />
            </TabPanel>

          </Grid>

          <Grid item xs={12} md={5} p={1}>
            <Paper sx={{ padding: "24px", "& .MuiBox-root": { padding: 0 } }}>
              <Box>
                <Typography variant="h5" mb={1}>
                  Notes
                </Typography>
              </Box>
              <TagForm
                data={statement.tags}
                extraData={{ parentId: statement.id, service: statementService }}
                setter={setStatement}
              />
              <Divider sx={{ margin: "36px 0" }} />
              <NoteDetails extraData={{ connectivity_statement_id: statement.id }} />
            </Paper>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default StatementDetails;
