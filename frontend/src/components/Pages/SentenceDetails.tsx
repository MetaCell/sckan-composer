import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import { useParams } from "react-router-dom";
import sentenceService from "../../services/SentenceService";
import NoteForm from "../Forms/NoteForm";
import TagForm from "../Forms/TagForm";
import {ConnectivityStatement, Sentence, SentenceConnectivityStatement} from "../../apiclient/backend";
import { userProfile } from "../../services/UserService";
import CheckDuplicates from "../CheckForDuplicates/CheckDuplicatesDialog";
import {SentenceStateChip} from "../Widgets/StateChip";
import {SentenceLabels, formatDate, formatTime} from "../../helpers/helpers";
import Stack from "@mui/material/Stack";
import GroupedButtons from "../Widgets/CustomGroupedButtons";
import StatementForm from "../Forms/StatementForm";
import DoisForm from "../Forms/DoisForm";
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SentenceForm from '../Forms/SentenceForm'
import SpeciesForm from "../Forms/SpeciesForm";
import Divider from "@mui/material/Divider";
import KnowledgeStatementsForm from "../Forms/KnowledgeStatements";
import {Accordion, AccordionDetails, AccordionSummary} from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const SentencesDetails = () => {
  const { sentenceId } = useParams();
  const [sentence, setSentence] = useState({} as Sentence);
  const [loading, setLoading] = useState(true);
  const [extraStatementForm, setExtraStatementForm] = useState<SentenceConnectivityStatement[]>([]);
  const [numForms, setNumForms] = useState(1);

  const [open, setOpen] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  // const [expanded, setExpanded] = React.useState<number>(0);
  const [expanded, setExpanded] = React.useState<string | false>('panel-0');

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
    setNumForms(numForms + 1);
  }

  const handleMenuItemClick = (
    event: React.MouseEvent<HTMLLIElement, MouseEvent>,
    index: number,
  ) => {
    setSelectedIndex(index);
    setOpen(false);
  };
  console.log(sentence)
  useEffect(() => {
    if (sentenceId) {
      sentenceService
        .getObject(sentenceId)
        .then((sentence: Sentence) => {
          setSentence(sentence);
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
          setLoading(false);
        });
    }
  }, [sentenceId]);

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
            {!disabled &&
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
            <Paper>
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
              Array.from({ length: numForms })?.map((_, key) =>
                    <Grid item xs={12}>
                      <Box p={1} mb={2} sx={{background: '#F2F4F7', borderRadius: '12px'}}>
                        <Grid container spacing={1} alignItems='center'>
                          <Grid item xs={11}>

                            <Paper>
                              <KnowledgeStatementsForm
                                data={sentence}
                                disabled={disabled}
                                format="small"
                                setter={setSentence}
                                extraData={{parentId: sentence.id}}
                              />
                              <DoisForm
                                data={sentence}
                                setter={setSentence}
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
                                    data={sentence}
                                    disabled={disabled}
                                    format="small"
                                    setter={setSentence}
                                    extraData={{parentId: sentence.id}}
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
                              key !== 0 &&  <DeleteOutlineIcon />
                            }
                          </Grid>
                          </Grid>
                      </Box>
                    </Grid>
              )
            }
            <Button onClick={onAddNewStatement}>
              Add Statement
            </Button>
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
              <TagForm
                data={sentence.tags}
                extraData={{ parentId: sentence.id, service: sentenceService }}
                setter={setSentence}
              />
              <Divider sx={{margin: '36px 0'}} />
              <NoteForm
                extraData={{ sentence_id: sentence.id }}
                setter={setSentence}
              />
            </Paper>
          </Grid>
          </Grid>
      </Grid>
    </Grid>
  );
};

export default SentencesDetails;
