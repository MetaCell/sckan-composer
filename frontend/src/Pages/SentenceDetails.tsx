import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import { useParams } from "react-router-dom";
import sentenceService from "../services/SentenceService";
import TagForm from "../components/Forms/TagForm";
import { Sentence, SentenceConnectivityStatement, SentenceAvailableTransitionsEnum } from "../apiclient/backend";
import { userProfile } from "../services/UserService";
import CheckDuplicates from "../components/CheckForDuplicates/CheckDuplicatesDialog";
import { SentenceStateChip } from "../components/Widgets/StateChip";
import { SentenceLabels, formatDate, formatTime } from "../helpers/helpers";
import Stack from "@mui/material/Stack";
import GroupedButtons from "../components/Widgets/CustomGroupedButtons";
import SentenceForm from "../components/Forms/SentenceForm";
import Divider from "@mui/material/Divider";
import { styled } from "@mui/material";
import { vars } from "../theme/variables";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import NoteDetails from "../components/Widgets/NotesFomList";
import TriageStatementSection from "../components/TriageStatementSection/TriageStatementSection";

const { bodyBgColor, darkBlue } = vars;

const StyledAddStatementBtn = styled(Button)(({ theme }) => ({
  height: "60px",
  background: bodyBgColor,
  borderRadius: "16px",
  color: darkBlue,

  "&:hover": {
    color: bodyBgColor,
  },
}));

const SentencesDetails = () => {
  const { sentenceId } = useParams();
  const [sentence, setSentence] = useState({} as Sentence);
  const [loading, setLoading] = useState(true);
  const [connectivityStatements, setConnectivityStatements] =
    useState<SentenceConnectivityStatement[]>();

  const [open, setOpen] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [refetch, setRefetch] = useState(false);

  const handleClick = () => {
    const transition = sentence?.available_transitions[selectedIndex];
    sentenceService
      .doTransition(sentence, transition)
      .then((sentence: Sentence) => {
        setSentence(sentence);
        setSelectedIndex(0);
      });
  };

  const onAddNewStatement = () => {
    setConnectivityStatements([
      // @ts-ignore
      ...connectivityStatements,
      {
        sentence_id: sentence.id,
        knowledge_statement: "",
        biological_sex: null,
        ans_division: null,
        species: [],
        dois: [],
      },
    ]);
  };

  const handleMenuItemClick = (
    event: React.MouseEvent<HTMLLIElement, MouseEvent>,
    index: number
  ) => {
    setSelectedIndex(index);
    setOpen(false);
  };

  const refreshSentence = () => {
    setRefetch(true);
  };

  useEffect(() => {
    if (sentenceId) {
      sentenceService
        .getObject(sentenceId)
        .then((sentence: Sentence) => {
          setSentence(sentence);
          const foundToBeReviewed = sentence.available_transitions.findIndex((transition) => transition === SentenceAvailableTransitionsEnum.ToBeReviewed)
          setSelectedIndex(foundToBeReviewed && foundToBeReviewed !== -1 ? foundToBeReviewed : 0)
          setConnectivityStatements(sentence.connectivity_statements.sort((a,b)=>a.id-b.id));
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
          setRefetch(false);
          setLoading(false);
        });
    }
  }, [sentenceId, refetch]);

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
                Sentence Details #{sentenceId}{" "}
                <span>
                  <SentenceStateChip
                    key={sentence?.state}
                    value={sentence?.state}
                  />
                </span>
              </Typography>
              <span>
                Last Edited on {formatDate(sentence?.modified_date)},{" "}
                {formatTime(sentence?.modified_date)}
              </span>
            </Box>
          </Grid>
          <Grid item xs={12} md={6} display="flex" justifyContent="flex-end">
            {!disabled && sentence?.available_transitions?.length !== 0 && (
              <GroupedButtons
                handleClick={handleClick}
                selectedOption={
                  SentenceLabels[sentence?.available_transitions[selectedIndex]]
                }
                options={sentence?.available_transitions}
                selectedIndex={selectedIndex}
                handleMenuItemClick={handleMenuItemClick}
                hasFormat={true}
                format={SentenceLabels}
              />
            )}
          </Grid>
        </Grid>
      </Grid>

      <Grid item xs={12}>
        <Grid container spacing={1}>
          <Grid item xs={12} md={7}>
            <Paper>
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
                    <CheckDuplicates />
                  </Stack>
                </Grid>
                {connectivityStatements?.map((statement, key) => (
                  <TriageStatementSection
                    statement={statement}
                    key={key}
                    index={key}
                    refreshSentence={refreshSentence}
                    setRefresh={setRefetch}
                    setSentence={setSentence}
                    sentence={sentence}
                  />
                ))}
                <StyledAddStatementBtn
                  startIcon={<AddCircleIcon />}
                  variant="contained"
                  fullWidth={true}
                  onClick={onAddNewStatement}
                >
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
            <Paper sx={{ "& .MuiBox-root": { padding: 0 } }}>
              <Box>
                <Typography variant="h5" mb={1}>
                  Notes
                </Typography>
              </Box>
              <TagForm
                data={sentence.tags}
                extraData={{ parentId: sentence.id, service: sentenceService }}
                setter={refreshSentence}
              />
              <Divider sx={{ margin: "36px 0" }} />
              <NoteDetails extraData={{ sentence_id: sentence.id }} />
            </Paper>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default SentencesDetails;
