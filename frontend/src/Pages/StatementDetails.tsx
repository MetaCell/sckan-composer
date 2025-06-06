import React, {useEffect, useState, useRef} from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TabPanel from "../components/Widgets/TabPanel";
import {useParams} from "react-router-dom";
import statementService from "../services/StatementService";
import TagForm from "../components/Forms/TagForm";
import {
  ComposerConnectivityStatementListStateEnum as statementStates,
  ConnectivityStatement
} from "../apiclient/backend";
import ProofingTab from "../components/ProofingTab/ProofingTab";
import {SentenceStateChip} from "../components/Widgets/StateChip";
import {formatDate, formatTime, StatementsLabels} from "../helpers/helpers";
import GroupedButtons from "../components/Widgets/CustomGroupedButtons";
import Divider from "@mui/material/Divider";
import NoteDetails from "../components/Widgets/NotesFomList";
import DistillationTab from "../components/DistillationTab/DistillationTab";
import {useSectionStyle} from "../styles/styles";
import {useTheme} from "@mui/system";
import IconButton from "@mui/material/IconButton";
import {
  EditOutlined,
  BiotechOutlined,
  BubbleChartOutlined,
  FindInPageOutlined,
  InputOutlined,
} from "@mui/icons-material";
import Stack from "@mui/material/Stack";
import {ViaIcon, DestinationIcon, OriginIcon} from "../components/icons";
import {CircularProgress} from "@mui/material";
import {checkOwnership, getOwnershipAlertMessage} from "../helpers/ownershipAlert";
import {ChangeRequestStatus} from "../helpers/settings";
import {useDispatch, useSelector} from "react-redux";
import {RootState} from "../redux/store";
import ConfirmationDialog from "../components/ConfirmationDialog";
import {CONFIRMATION_DIALOG_CONFIG} from "../settings";
import {setDialogState, setPositionChangeOnly, setWasChangeDetected} from "../redux/statementSlice";

const StatementDetails = () => {
  const {statementId} = useParams();
  const [statement, setStatement] = useState({} as ConnectivityStatement);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [refetch, setRefetch] = useState(false);
  const [isNavigateDialogOpen, setIsNavigateDialogOpen] = useState(false);
  const dispatch = useDispatch();
  const dialogsState = useSelector((state: RootState) => state.statement.dialogs);
  
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
  const wasChangeDetected = useSelector((state: RootState) => state.statement.wasChangeDetected);
  const positionChangeOnly = useSelector((state: RootState) => state.statement.positionChangeOnly);
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    if (dialogsState.navigate) {
      setActiveTab(newValue);
      dispatch(setWasChangeDetected(false));
      dispatch(setPositionChangeOnly(false));
      return;
    }
    if (wasChangeDetected || positionChangeOnly) {
      setIsNavigateDialogOpen(true);
    } else {
      setActiveTab(newValue);
    }
  };
  
  const handleNavigateConfirm = () => {
    setIsNavigateDialogOpen(false);
    setActiveTab(0)
    dispatch(setWasChangeDetected(false));
    dispatch(setPositionChangeOnly(false));
  };
  
  const handleNavigateCancel = () => {
    setIsNavigateDialogOpen(false);
    scrollToElement(6);
  };
  
  const scrollToElement = (index: number) => {
    const element = refs[index].current;
    if (element) {
      element.scrollIntoView({behavior: "smooth"});
    }
  };

  const theme = useTheme();
  const sectionStyle = useSectionStyle(theme);
  
  const doTransition = () => {
    const transition = statement?.available_transitions[selectedIndex];
    if (statement.id) {
      return checkOwnership(
        statement.id,
        async (fetchedData, userId) => {
          // Update the statement with the new ownership if reassigned
          const updatedStatement = { ...statement, owner_id: userId };
          
          // Proceed with the transition once ownership is confirmed
          const result = await statementService.doTransition(updatedStatement, transition);
          setStatement(result);
          setSelectedIndex(0);
          return result;
        },
        () => {
          return ChangeRequestStatus.CANCELLED;
          },
        getOwnershipAlertMessage // message to show when ownership needs to be reassigned
      );
    }
  };
  const handleMenuItemClick = (
    event: React.MouseEvent<HTMLLIElement, MouseEvent>,
    index: number,
  ) => {
    setSelectedIndex(index);
  };

  const refreshStatement = () => {
    setRefetch(true);
    setLoading(true);
  };

  useEffect(() => {
    if (statementId) {
      statementService
        .getObject(statementId)
        .then((statement: ConnectivityStatement) => {
          setStatement(statement);
          //   if (
          //     statement.owner &&
          //     statement.owner?.id !== userProfile.getUser().id
          //   ) {
          //     if (
          //       window.confirm(
          //         `This statement is assigned to ${statement.owner.first_name}, assign to yourself? To view the record without assigning ownership, select Cancel.`,
          //       )
          //     ) {
          //       const statementIdNumber = statement.id ?? -1; // Ensure statement.id is a number, use -1 as a fallback
          //
          //       statementService
          //         .assignOwner(statementIdNumber, {
          //           ...statement,
          //           owner_id: userProfile.getUser().id
          //         }).then((statement: ConnectivityStatement) => {
          //         setStatement(statement);
          //       });
          //     }
          //   }
        })
        .finally(() => {
          setLoading(false);
          setRefetch(false);
        });
    }
  }, [statementId, refetch]);

  //TODO add logic for isDisabled
  // TODO add an extra check for invalid state;
  const isDisabled = statement?.state === statementStates.Exported || statement?.state === statementStates.Invalid;
  return (
    <Grid p={6} container>
      {loading && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "#f2f4f74f",
            zIndex: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress/>
        </div>
      )}
      {(statement.knowledge_statement !== undefined && statement.knowledge_statement !== null) && (
        <>
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
                <BiotechOutlined/>
              </IconButton>
              <Divider/>
              {activeTab === 0 && (
                <>
                  <IconButton onClick={() => scrollToElement(2)}>
                    <FindInPageOutlined/>
                  </IconButton>
                  <IconButton onClick={() => scrollToElement(1)}>
                    <InputOutlined/>
                  </IconButton>
                </>
              )}
              {activeTab === 1 && (
                <>
                  <IconButton onClick={() => scrollToElement(3)}>
                    <OriginIcon/>
                  </IconButton>
                  <IconButton onClick={() => scrollToElement(4)}>
                    <ViaIcon/>
                  </IconButton>
                  <IconButton onClick={() => scrollToElement(5)}>
                    <DestinationIcon/>
                  </IconButton>
                  <Divider/>

                  <IconButton onClick={() => scrollToElement(6)}>
                    <BubbleChartOutlined/>
                  </IconButton>
                </>
              )}
              <Divider/>

              <IconButton onClick={() => scrollToElement(7)}>
                <EditOutlined/>
              </IconButton>
            </Stack>
          </Grid>
          <Grid item xs={11}>
            <Grid container>
              <Grid item xs={12} mb={4}>
                <Grid container>
                  <Grid item xs={12} md={6}>
                    <Box ref={refs[0]}>
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
                          StatementsLabels[statement?.available_transitions[selectedIndex] as keyof typeof StatementsLabels]

                        }
                        options={statement?.available_transitions}
                        selectedIndex={selectedIndex}
                        handleMenuItemClick={handleMenuItemClick}
                        hasFormat={true}
                        format={StatementsLabels}
                      />
                    ) : (
                      <GroupedButtons
                        isDisabled
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
                    onChange={handleTabChange}
                    sx={{
                      borderBottom: "1px solid #EAECF0",
                    }}
                  >
                    <Tab label="Distillation"/>
                    <Tab label="Proofing"/>
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
                        isDisabled={isDisabled}
                        refs={refs}
                      />
                    </TabPanel>
                    <TabPanel value={activeTab} index={1}>
                      <ProofingTab
                        statement={statement}
                        setStatement={setStatement}
                        refreshStatement={refreshStatement}
                        isDisabled={isDisabled}
                        refs={refs}
                      />
                    </TabPanel>
                  </Grid>

                  <Grid item xs={12}>
                    <Box ref={refs[7]}>
                      <Paper
                        sx={{
                          ...sectionStyle,
                          "& .MuiBox-root": {padding: 0},
                        }}
                      >
                        <Typography variant="h5" mb={1}>
                          Notes
                        </Typography>
                        <TagForm
                          data={statement.tags}
                          extraData={{
                            parentId: statement.id,
                            service: statementService,
                            statement
                          }}
                          setter={refreshStatement}
                          isDisabled={isDisabled}
                        />
                        <Divider sx={{margin: "36px 0"}}/>
                        <NoteDetails
                          extraData={{
                            connectivity_statement_id: statement.id,
                            type: 'statement'
                          }}
                          setter={refreshStatement}
                        />
                      </Paper>
                    </Box>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </>
      )}
      <ConfirmationDialog
        open={isNavigateDialogOpen}
        onConfirm={handleNavigateConfirm}
        onCancel={handleNavigateCancel}
        title={CONFIRMATION_DIALOG_CONFIG.Navigate.title}
        confirmationText={CONFIRMATION_DIALOG_CONFIG.Navigate.confirmationText}
        Icon={<CONFIRMATION_DIALOG_CONFIG.Navigate.Icon />}
        dontShowAgain={dialogsState.navigate}
        setDontShowAgain={() => dispatch(setDialogState({ dialogKey: "navigate", dontShow: true }))}
      />
    </Grid>
  );
};

export default StatementDetails;
