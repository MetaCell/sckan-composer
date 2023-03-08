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
import { Sentence } from "../../apiclient/backend";
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

const SentencesDetails = () => {
  const { sentenceId } = useParams();
  const [sentence, setSentence] = useState({} as Sentence);
  const [loading, setLoading] = useState(true);
  const [extraStatementForm, setExtraStatementForm] = useState<string[]>([""]);
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  const handleClick = () => {
    const transition = sentence?.available_transitions[selectedIndex]
    sentenceService
      .doTransition(sentence, transition)
      .then((sentence: Sentence) => {
        setSentence(sentence);
        setSelectedIndex(0)
      });
  };

  const handleMenuItemClick = (
    event: React.MouseEvent<HTMLLIElement, MouseEvent>,
    index: number,
  ) => {
    setSelectedIndex(index);
    setOpen(false);
  };

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event: Event) => {
    if (
      anchorRef.current &&
      anchorRef.current.contains(event.target as HTMLElement)
    ) {
      return;
    }

    setOpen(false);
  };

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
              extraStatementForm?.map((row, key) =>

                    <Grid item xs={12}>
                      <Box p={1} mb={2} sx={{background: '#F2F4F7', borderRadius: '12px'}}>
                        <Grid container spacing={1} alignItems='center'>
                          <Grid item xs={11}>
                            <Paper>
                              <DoisForm
                                data={sentence}
                                extraData={{ parentId: sentence.id }}
                                setter={setSentence}
                              />
                              <StatementForm
                                data={sentence}
                                disabled={disabled}
                                format="small"
                                setter={setSentence}
                              />
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
            <Button onClick={() => setExtraStatementForm((prev) => [...prev, ""])}>
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

          <Grid item xs={12} md={5}>
            <Box>
              <TagForm
                data={sentence.tags}
                extraData={{ parentId: sentence.id, service: sentenceService }}
                setter={setSentence}
              />

              <NoteForm
                extraData={{ sentence_id: sentence.id }}
                setter={setSentence}
              />
            </Box>
          </Grid>
          </Grid>
      </Grid>
    </Grid>
  );
};

export default SentencesDetails;
