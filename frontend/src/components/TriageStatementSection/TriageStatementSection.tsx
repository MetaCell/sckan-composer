import React, {useEffect, useState} from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import { Typography } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import StatementDetailsAccordion from "./StatementDetailsAccordion";
import statementService from "../../services/StatementService";
import StatementForm from "../Forms/StatementForm";
import ProvenancesForm from "../Forms/ProvenanceForm";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useSectionStyle, useGreyBgContainer } from "../../styles/styles";
import { useTheme } from "@mui/system";
import {
  SentenceAvailableTransitionsEnum as SentenceStates,
  ComposerConnectivityStatementListStateEnum as statementStates,
} from "../../apiclient/backend";

const TriageStatementSection = (props: any) => {
  const { statement, refreshSentence, sentence } = props;
  const [isDisabled, setIsDisabled] = useState(false);

  const theme = useTheme()
  const sectionStyle = useSectionStyle(theme)
  const greyBgContainer = useGreyBgContainer(theme)

  const onDeleteStatement = (id: number) => {
    statementService.remove(id).then(() => refreshSentence());
  };

  const onCloneStatement = (id: number) =>{
    statementService.clone(id).then(()=>refreshSentence())
  }
  
  useEffect(() => {
    if (statement.id) {
      statementService.getObject(statement.id).then((response: any) => {
        if (response.state === statementStates.Exported || response.state === statementStates.Invalid) {
          setIsDisabled(true);
        }
      });
    }
  }, [statement.id]);

  return (
    <Grid item xs={12}>
      <Box
        mb={2}
        sx={greyBgContainer}
      >
        <Grid container spacing={1} alignItems="center">
          <Grid item xs={11}>
          {statement?.id ? <Typography variant="h6" ml={1}>Statement {statement.id}</Typography> : <></>}
            <Paper sx={{...sectionStyle, p:0}}>
              <StatementForm
                statement={statement}
                format="small"
                setter={refreshSentence}
                extraData={{ sentence_id: sentence.id }}
                uiFields={["knowledge_statement"]}
                className='ks'
                enableAutoSave={true}
                isDisabled={isDisabled}
              />

              <ProvenancesForm
                provenancesData={statement.provenances}
                extraData={{ connectivity_statement_id: statement.id }}
                setter={refreshSentence}
                className='provenance'
                isDisabled={isDisabled}
              />
              {statement.id && (
                <StatementDetailsAccordion
                  setter={refreshSentence}
                  isDisabled={isDisabled}
                  {...props}
                />
              )}
            </Paper>
          </Grid>
          <Grid item xs={1} textAlign="center">

            <IconButton
              disabled={!statement.id || sentence.state === SentenceStates.ComposeNow}
              onClick={() => onCloneStatement(statement.id)}
              sx={{mb:1}}
            >
              <ContentCopyIcon sx={{ color: "#98A2B3" }}  />
            </IconButton>
            <IconButton
              disabled={!statement.id || sentence.state === SentenceStates.ComposeNow}
              onClick={() => onDeleteStatement(statement.id)}
            >
              <DeleteOutlineIcon sx={{ color: "#98A2B3" }} />
            </IconButton>
          </Grid>
        </Grid>
      </Box>
    </Grid>
  );
};

export default TriageStatementSection;
