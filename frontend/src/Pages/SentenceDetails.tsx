import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import { useParams } from "react-router-dom";
import sentenceService from "../services/SentenceService";
import NoteForm from "../components/Forms/NoteForm";
import TagForm from "../components/Forms/TagForm";
import {Doi, Sentence, SentenceConnectivityStatement} from "../apiclient/backend";
import { userProfile } from "../services/UserService";
import CheckDuplicates from "../components/CheckForDuplicates/CheckDuplicatesDialog";
import {SentenceStateChip} from "../components/Widgets/StateChip";
import {SentenceLabels, formatDate, formatTime} from "../helpers/helpers";
import Stack from "@mui/material/Stack";
import GroupedButtons from "../components/Widgets/CustomGroupedButtons";
import StatementForm from "../components/Forms/StatementForm";
import DoisForm from "../components/Forms/DoisForm";
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SentenceForm from '../components/Forms/SentenceForm'
import SpeciesForm from "../components/Forms/SpeciesForm";
import Divider from "@mui/material/Divider";
import {Accordion, AccordionDetails, AccordionSummary, styled} from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CustomTextArea from "../components/Widgets/CustomTextArea";
import statementService from "../services/StatementService";
import { vars } from "../theme/variables";
import AddCircleIcon from '@mui/icons-material/AddCircle';
import NoteDetails from "../components/Widgets/NotesFomList";

const initialConnectivityStatement = {knowledge_statement: "", biological_sex: null, ans_division: null, species: [] , dois: []}
const { bodyBgColor, darkBlue } = vars

const StyledAddStatementBtn = styled(Button)(({ theme }) => ({
  height: '60px',
  background: bodyBgColor,
  borderRadius: '16px',
  color: darkBlue,

  "&:hover": {
    color: bodyBgColor
  }
}));

const SentencesDetails = () => {
  const { sentenceId } = useParams();
  const [sentence, setSentence] = useState({} as Sentence);
  const [loading, setLoading] = useState(true);
  let connectivityStatements: SentenceConnectivityStatement[],
    setConnectivityStatements: (value: (SentenceConnectivityStatement | { ans_division: null; biological_sex: null; knowledge_statement: string, species: [] , dois: [] })[]) => void;
  // @ts-ignore
  [connectivityStatements, setConnectivityStatements] = useState<SentenceConnectivityStatement[]>([initialConnectivityStatement]);

  const [open, setOpen] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [expanded, setExpanded] = React.useState<string | false>('panel-0');
  const [divisionList,setDivisionList] = useState([])
  const [biologicalSex,setBiologicalSexList] = useState([])
  const [refetch, setRefetch] = useState(false)

  const handleChange =
    (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };

  const handleClick = () => {
    const transition = sentence?.available_transitions[selectedIndex]
    sentenceService
      .doTransition(sentence, transition)
      .then((sentence: Sentence) => {
        setSentence(sentence);
        setSelectedIndex(0)
      });
  };

  const onAddNewStatement = () => {
    // @ts-ignore
    setConnectivityStatements([...connectivityStatements, initialConnectivityStatement]);
  }

  const handleMenuItemClick = (
    event: React.MouseEvent<HTMLLIElement, MouseEvent>,
    index: number,
  ) => {
    setSelectedIndex(index);
    setOpen(false);
  };

  const onDeleteStatement = (id: number) => {
    statementService.remove(id).then(() => setRefetch(true))
  }

  const refreshSentence = () => {
    setRefetch(true)
  }

  useEffect(() => {
    if (sentenceId) {
      sentenceService
        .getObject(sentenceId)
        .then((sentence: Sentence) => {
          setSentence(sentence);
          setConnectivityStatements(sentence.connectivity_statements)
          if (
            sentence.owner &&
            sentence.owner?.id !== userProfile.getUser().id
          ) {
            if (
              window.confirm(
                `This sentence is assigned to ${sentence.owner.first_name}, assign to yourself?`
              )
            ) {
              sentenceService
                .save({ ...sentence, owner_id: userProfile.getUser().id })
                .then((sentence: Sentence) => {
                  setSentence(sentence);
                });
            }
          }
        })
        .finally(() => {
          setRefetch(false)
          setLoading(false);
        });
    }
  }, [sentenceId, refetch]);

  useEffect(() => {
    statementService.getANSDivisionList().then((result) => {
      setDivisionList(result.results)
    })
    statementService.getBiologicalSexList().then((result) => {
      setBiologicalSexList(result.results)
    })
  }, [])

  if (loading) {
    return <div>Loading...</div>;
  }

  const disabled = sentence.owner?.id !== userProfile.getUser().id;

  return (
    <Grid p={6} container>
      <Grid item xs={12} mb={4}>
        <Grid container>
          <Grid item xs={12} md={6}>
            <Box>
              <Typography variant="h3" mb={1}>
                Sentence Details #{sentenceId} <span><SentenceStateChip key={sentence?.state} value={sentence?.state} /></span>
              </Typography>
              <span>
                Last Edited on  {formatDate(sentence?.modified_date)}, {formatTime(sentence?.modified_date)}
              </span>
            </Box>
          </Grid>
          <Grid item xs={12} md={6} display='flex' justifyContent='flex-end'>
            {!disabled && sentence?.available_transitions?.length !== 0 &&
              <GroupedButtons
                handleClick={handleClick}
                selectedOption={SentenceLabels[sentence?.available_transitions[selectedIndex]]}
                options={sentence?.available_transitions}
                selectedIndex={selectedIndex}
                handleMenuItemClick={handleMenuItemClick}
                hasFormat={true}
                format={SentenceLabels}
              />
            }
          </Grid>
        </Grid>
      </Grid>

      <Grid item xs={12}>
        <Grid container spacing={1}>
          <Grid item xs={12} md={7}>
            <Paper sx={{
              border: 0,
              boxShadow: 'none'
            }}>
              <Grid container p={3}  mb={2}>
                <Grid item xs={12}>
                  <Stack direction="row" justifyContent="space-between"
                         sx={{
                           "& .MuiButtonBase-root": {
                             padding: 0
                           }
                         }}>
                    <Typography variant="h5" mb={1}>
                      Knowledge Statements
                    </Typography>
                    <CheckDuplicates />
                  </Stack>
                </Grid>
                {
                  connectivityStatements?.map((statement, key) =>
                    <Grid item xs={12}>
                      <Box p={1} mb={2} sx={{background: bodyBgColor, borderRadius: '12px'}}>
                        <Grid container spacing={1} alignItems='center'>
                          <Grid item xs={11}>
                            <Paper sx={{
                              border: 0,
                              boxShadow: 'none'
                            }}>
                              <StatementForm
                                divisionList={divisionList}
                                biologicalSex={biologicalSex}
                                statement={statement}
                                format="small"
                                setter={refreshSentence}
                                extraData={{sentence_id: sentence.id}}
                                uiFields={["knowledge_statement"]}
                              />
                              <DoisForm
                                key={key}
                                doisData={statement.dois}
                                extraData={{connectivity_statement_id: statement.id}}
                                setter={refreshSentence}
                              />
                              <Accordion expanded={expanded === `panel-${key}`} onChange={handleChange(`panel-${key}`)}>
                                <AccordionSummary
                                  expandIcon={<ExpandMoreIcon />}
                                  aria-controls="panel1bh-content"
                                  id="panel1bh-header"
                                >
                                  <Typography>
                                    Statement Details
                                  </Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                  <StatementForm
                                    divisionList={divisionList}
                                    biologicalSex={biologicalSex}
                                    statement={statement}
                                    format="small"
                                    setter={setSentence}
                                    extraData={{sentence_id: sentence.id, knowledge_statement: connectivityStatements[key].knowledge_statement}}
                                    uiFields={["biological_sex_id", "apinatomy_model", "circuit_type", "laterality", "ans_division_id"]}
                                  />
                                  <SpeciesForm
                                    data={sentence}
                                    extraData={{ parentId: sentence.id }}
                                    setter={setSentence}
                                  />
                                </AccordionDetails>
                              </Accordion>
                            </Paper>

                          </Grid>
                          <Grid item xs={1} textAlign='center'>
                            {
                              key !== 0 &&  <DeleteOutlineIcon
                                onClick={() => onDeleteStatement(statement.id)}
                                sx={{ cursor: 'pointer', color:'#98A2B3' }}
                              />
                            }
                          </Grid>
                          </Grid>
                      </Box>
                    </Grid>
                  )
                }
            <StyledAddStatementBtn startIcon={<AddCircleIcon />} variant="contained" fullWidth={true} onClick={onAddNewStatement}>
              Add a knowledge statement
            </StyledAddStatementBtn>
              </Grid>
            </Paper>
            <SentenceForm
              data={sentence}
              disabled={disabled}
              format="small"
              setter={setSentence}
            />
          </Grid>

          <Grid item xs={12} md={5} p={1}>
            <Paper sx={{padding: '24px', "& .MuiBox-root": {padding: 0}}}>
              <Box>
                <Typography variant="h5" mb={1}>
                  Notes
                </Typography>
              </Box>
              <TagForm
                data={sentence.tags}
                extraData={{ parentId: sentence.id, service: sentenceService }}
                setter={setSentence}
              />
              <Divider sx={{margin: '36px 0'}} />
              <NoteDetails
                extraData={{ sentence_id: sentence.id }}
              />
            </Paper>
          </Grid>
          </Grid>
      </Grid>
    </Grid>
  );
};

export default SentencesDetails;
