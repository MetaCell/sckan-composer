import React, { useEffect, useState, useRef } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
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
import ProofingTab from "../components/ProofingTab/ProofingTab";
import { SentenceStateChip } from "../components/Widgets/StateChip";
import { formatDate, formatTime, StatementsLabels } from "../helpers/helpers";
import GroupedButtons from "../components/Widgets/CustomGroupedButtons";
import Divider from "@mui/material/Divider";
import NoteDetails from "../components/Widgets/NotesFomList";
import DistillationTab from "../components/DistillationTab";
import { useSectionStyle } from "../styles/styles";
import { useTheme } from "@mui/system";
import IconButton from "@mui/material/IconButton";
import {
  EditNoteOutlined,
  BiotechOutlined,
  BubbleChartOutlined,
  FindInPageOutlined,
  InputOutlined,
} from "@mui/icons-material";
import Stack from "@mui/material/Stack";
import { ViaIcon, DestinationIcon, OriginIcon } from "../components/icons";
const StatementDetails = () => {
  const { statementId } = useParams();
  const [statement, setStatement] = useState({} as ConnectivityStatement);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [open, setOpen] = React.useState(false);
  const [refetch, setRefetch] = useState(false);
  const refs = [
    useRef<HTMLElement | null>(null),
    useRef<HTMLElement | null>(null),
    useRef<HTMLElement | null>(null),
    useRef<HTMLElement | null>(null),
    useRef<HTMLElement | null>(null),
    useRef<HTMLElement | null>(null),
    useRef<HTMLElement | null>(null),
    useRef<HTMLElement | null>(null),
  ];

  const scrollToElement = (index: number) => {
    const element = refs[index].current;
    console.log(index);

    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const theme = useTheme();
  const sectionStyle = useSectionStyle(theme);

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
    index: number,
  ) => {
    setSelectedIndex(index);
    setOpen(false);
  };

  const refreshStatement = () => {
    setRefetch(true);
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
                `This statement is assigned to ${statement.owner.first_name}, assign to yourself? To view the record without assigning ownership, select Cancel.`,
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
          setRefetch(false);
        });
    }
  }, [statementId, refetch]);

  if (loading) {
    return <div>Loading...</div>;
  }

  //TODO add logic for disabled
  // something like this statement.owner?.id !== userProfile.getUser().id;
  const disabled = false;

  return (
    <Grid p={6} container>
      <Grid item xs={1}>
        <Stack
          spacing="1rem"
          sx={{
            borderRadius: "1.75rem",
            border: "1px solid #F2F4F7",
            background: "#FFF",
            boxShadow:
              "0px 4px 6px -2px rgba(16, 24, 40, 0.03), 0px 12px 16px -4px rgba(16, 24, 40, 0.08)",
            width: "fit-content",
            padding: "1.25rem .75rem",
            position: "sticky",
            top: 200,
            alignSelf: "flex-start",
            marginRight: "1rem",

            "& .MuiSvgIcon-root": {
              color: "#344054",
            },

            "& .MuiDivider-root": {
              borderColor: "#F2F4F7",
            },
          }}
        >
          <IconButton onClick={() => scrollToElement(0)}>
            <BiotechOutlined />
          </IconButton>
          <Divider />
          {activeTab === 0 && (
            <>
              <IconButton onClick={() => scrollToElement(2)}>
                <FindInPageOutlined />
              </IconButton>
              <IconButton onClick={() => scrollToElement(1)}>
                <InputOutlined />
              </IconButton>
            </>
          )}
          {activeTab === 1 && (
            <>
              <IconButton onClick={() => scrollToElement(3)}>
                <OriginIcon />
              </IconButton>
              <IconButton onClick={() => scrollToElement(4)}>
                <ViaIcon />
              </IconButton>
              <IconButton onClick={() => scrollToElement(5)}>
                <DestinationIcon />
              </IconButton>
              <Divider />

              <IconButton onClick={() => scrollToElement(6)}>
                <BubbleChartOutlined />
              </IconButton>
            </>
          )}
          <Divider />

          <IconButton onClick={() => scrollToElement(7)}>
            <EditNoteOutlined />
          </IconButton>
        </Stack>
      </Grid>
      <Grid item xs={11}>
        <Grid container>
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
              <Grid
                item
                xs={12}
                md={6}
                display="flex"
                justifyContent="flex-end"
              >
                {statement.available_transitions &&
                statement.available_transitions.length > 0 ? (
                  <GroupedButtons
                    handleClick={doTransition}
                    selectedOption={
                      StatementsLabels[
                        statement?.available_transitions[selectedIndex]
                      ]
                    }
                    options={statement?.available_transitions}
                    selectedIndex={selectedIndex}
                    handleMenuItemClick={handleMenuItemClick}
                    hasFormat={true}
                    format={StatementsLabels}
                  />
                ) : (
                  <GroupedButtons
                    disabled
                    selectedOption="No options available"
                  />
                )}
              </Grid>
            </Grid>
          </Grid>

          <Grid item xl={12} mb={4}>
            <Box>
              <Tabs
                value={activeTab}
                variant="standard"
                onChange={(e, i: number) => setActiveTab(i)}
                sx={{
                  borderBottom: "1px solid #EAECF0",
                }}
              >
                <Tab label="Distillation" />
                <Tab label="Proofing" />
              </Tabs>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Grid container spacing={2}>
              <Grid item md={12}>
                <TabPanel value={activeTab} index={0}>
                  <DistillationTab
                    statement={statement}
                    setStatement={setStatement}
                    refreshStatement={refreshStatement}
                    disabled={disabled}
                    refs={refs}
                  />
                </TabPanel>
                <TabPanel value={activeTab} index={1}>
                  <ProofingTab
                    statement={statement}
                    setStatement={setStatement}
                    refreshStatement={refreshStatement}
                    disabled={disabled}
                    refs={refs}
                  />
                </TabPanel>
              </Grid>

              <Grid item xs={12}>
                <Box ref={refs[7]}>
                  <Paper
                    sx={{ ...sectionStyle, "& .MuiBox-root": { padding: 0 } }}
                  >
                    <Typography variant="h5" mb={1}>
                      Notes
                    </Typography>
                    <TagForm
                      data={statement.tags}
                      extraData={{
                        parentId: statement.id,
                        service: statementService,
                      }}
                      setter={refreshStatement}
                    />
                    <Divider sx={{ margin: "36px 0" }} />
                    <NoteDetails
                      extraData={{ connectivity_statement_id: statement.id }}
                    />
                  </Paper>
                </Box>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default StatementDetails;
