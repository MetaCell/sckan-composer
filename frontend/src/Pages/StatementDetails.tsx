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
import statementService from "../services/StatementService";
import TagForm from "../components/Forms/TagForm";
import { ConnectivityStatement } from "../apiclient/backend";
import { userProfile } from "../services/UserService";
import ProofingTab from "../components/ProofingTab";
import {SentenceStateChip} from "../components/Widgets/StateChip";
import {formatDate, formatTime, SentenceLabels, StatementsLabels} from "../helpers/helpers";
import GroupedButtons from "../components/Widgets/CustomGroupedButtons";
import SentenceForm from "../components/Forms/SentenceForm";
import Divider from "@mui/material/Divider";
import NoteDetails from "../components/Widgets/NotesFomList";
import SpeciesForm from "../components/Forms/SpeciesForm";
import StatementForm from "../components/Forms/StatementForm";
import DistillationTab from "../components/DistillationTab";

const StatementDetails = () => {
  const { statementId } = useParams();
  const [statement, setStatement] = useState({} as ConnectivityStatement);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [open, setOpen] = React.useState(false);

  const doTransition = () => {
    const transition = statement?.available_transitions[selectedIndex];
    statementService
      .doTransition(statement, transition)
      .then((statement: ConnectivityStatement) => {
        setStatement(statement);
        setSelectedIndex(0);
      });
  };

  const handleMenuItemClick = (
    event: React.MouseEvent<HTMLLIElement, MouseEvent>,
    index: number
  ) => {
    setSelectedIndex(index);
    setOpen(false);
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
            <GroupedButtons
              handleClick={doTransition}
              selectedOption={
                StatementsLabels[statement?.available_transitions[selectedIndex]]
              }
              options={statement?.available_transitions}
              selectedIndex={selectedIndex}
              handleMenuItemClick={handleMenuItemClick}
              hasFormat={true}
              format={StatementsLabels}
            />
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
        <Grid container spacing={2}>
          <Grid item xs={12} md={7}>
            <TabPanel value={activeTab} index={0}>
              <DistillationTab statement={statement} setStatement={setStatement} />
            </TabPanel>
            <TabPanel value={activeTab} index={1}>
              <ProofingTab statement={statement} />
            </TabPanel>

          </Grid>

          <Grid item xs={12} md={5}>
            <Paper sx={{ "& .MuiBox-root": { padding: 0 } }}>
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
