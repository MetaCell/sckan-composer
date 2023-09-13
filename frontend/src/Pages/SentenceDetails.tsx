import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import { useParams } from "react-router-dom";
import sentenceService from "../services/SentenceService";
import TagForm from "../components/Forms/TagForm";
import { Sentence, SentenceConnectivityStatement, SentenceAvailableTransitionsEnum } from "../apiclient/backend/api";
import { userProfile } from "../services/UserService";
import CheckDuplicates from "../components/CheckForDuplicates/CheckDuplicatesDialog";
import { SentenceStateChip } from "../components/Widgets/StateChip";
import { SentenceLabels, formatDate, formatTime } from "../helpers/helpers";
import Stack from "@mui/material/Stack";
import GroupedButtons from "../components/Widgets/CustomGroupedButtons";
import SentenceForm from "../components/Forms/SentenceForm";
import Divider from "@mui/material/Divider";
import {Backdrop, CircularProgress, styled} from "@mui/material";
import { vars } from "../theme/variables";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import NoteDetails from "../components/Widgets/NotesFomList";
import TriageStatementSection from "../components/TriageStatementSection/TriageStatementSection";
import { useSectionStyle } from "../styles/styles";
import { useTheme } from "@mui/system";
import {useAppSelector} from "../redux/hooks";
import {useNavigate} from "react-router";
import {QueryParams} from "../redux/sentenceSlice";

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

const shouldResearchWithoutFilters = (res: any, queryOptions: QueryParams) => {
  return !(res && res.results && res.results.length) && wasSearchFiltered(queryOptions)
}
const wasSearchFiltered = (queryOptions: QueryParams) => {
  return queryOptions.title || queryOptions.tagFilter || queryOptions.notes
};

const SentencesDetails = () => {
  const { sentenceId } = useParams();
  const [sentence, setSentence] = useState({} as Sentence);
  const [isLoading, setIsLoading] = useState(true);
  const [connectivityStatements, setConnectivityStatements] =
      useState<SentenceConnectivityStatement[]>();

  const [open, setOpen] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [refetch, setRefetch] = useState(false);


  const theme = useTheme()
  const sectionStyle = useSectionStyle(theme)

  const queryOptions = useAppSelector((state) => state.sentence.queryOptions);
  const navigate = useNavigate();

  const handleClick = () => {
    const fetchNextSentence = async (sentence: Sentence) => {
      try {
        const nextSentenceOptions = {
          ...queryOptions,
          stateFilter: ['open'] as ("open" | "to_be_reviewed" | "compose_later" | "compose_now" | "excluded" | "duplicate")[],
          exclude: [`${sentence.id}`],
          limit: 1,
          index: 0,
        };

        let res = await sentenceService.getList(nextSentenceOptions);
        if (shouldResearchWithoutFilters(res, queryOptions)) {
          res = await sentenceService.getList({
            notes: undefined,
            tagFilter: undefined,
            title: undefined,
            ordering: queryOptions.ordering,
            stateFilter: ['open'] as ("open" | "to_be_reviewed" | "compose_later" | "compose_now" | "excluded" | "duplicate")[],
            exclude: [`${sentence.id}`],
            limit: 1,
            index: 0,
          });
        }

        if (res && res.results && res.results.length) {
          const nextSentenceId = res.results[0].id;
          navigate(`/sentence/${nextSentenceId}`);
        } else {
          navigate('/');
        }

      } catch (error) {
        console.error("Error fetching the next sentence:", error);
      }
    };

    setIsLoading(true);
    const transition = sentence?.available_transitions[selectedIndex];
    sentenceService.doTransition(sentence, transition).then((sentence: Sentence) => fetchNextSentence(sentence))

  };

  const onAddNewStatement = () => {
    setConnectivityStatements([
      // @ts-ignore
      ...connectivityStatements,
      {
        sentence_id: sentence.id,
        knowledge_statement: "",
        sex: null,
        phenotype: null,
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
                      `This sentence is assigned to ${sentence.owner.first_name}, assign to yourself? To view the record without assigning ownership, select Cancel.`
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
            setIsLoading(false);
          });
    }
  }, [sentenceId, refetch]);

  console.log(isLoading)

  if (isLoading) {
    return (
        <Backdrop open={isLoading} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <CircularProgress color="inherit" />
        </Backdrop>
    )
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
          <Grid container spacing={2}>
            <Grid item xs={12} md={7}>
              <Paper sx={{mb:2, ...sectionStyle}}>
                <Grid container>
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
                      <Typography variant="h5" mb={3}>
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
                  enableAutoSave={true}
              />
            </Grid>

            <Grid item xs={12} md={5}>
              <Paper sx={{...sectionStyle , "& .MuiBox-root": { padding: 0 }}}>
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
