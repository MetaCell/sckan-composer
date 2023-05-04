import React from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import StatementDetailsAccordion from "./StatementDetailsAccordion";
import { vars } from "../../theme/variables";
import statementService from "../../services/StatementService";
import StatementForm from "../Forms/StatementForm";
import ProvenancesForm from "../Forms/ProvenanceForm";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useSectionStyle } from "../../styles/styles";
import { useTheme } from "@mui/system";
import { SentenceAvailableTransitionsEnum as SentenceStates } from "../../apiclient/backend";

const TriageStatementSection = (props: any) => {
  const { statement, refreshSentence, sentence } = props;

  const theme = useTheme()
  const sectionStyle = useSectionStyle(theme)

  const onDeleteStatement = (id: number) => {
    statementService.remove(id).then(() => refreshSentence());
  };

  const onCloneStatement = (id: number) =>{
    statementService.clone(id).then(()=>refreshSentence())
  }

  return (
    <Grid item xs={12}>
      <Box
        p={1}
        mb={2}
        sx={{ background: vars.bodyBgColor, borderRadius: "12px" }}
      >
        <Grid container spacing={1} alignItems="center">
          <Grid item xs={11}>
            <Paper sx={{...sectionStyle, p:0}}>
              <StatementForm
                statement={statement}
                format="small"
                setter={refreshSentence}
                extraData={{ sentence_id: sentence.id }}
                uiFields={["knowledge_statement"]}
                className='ks'
                enableAutoSave={true}
              />

              <ProvenancesForm
                provenancesData={statement.provenances}
                extraData={{ connectivity_statement_id: statement.id }}
                setter={refreshSentence}
                className='provenance'
              />
              {statement.id && (
                <StatementDetailsAccordion
                  setter={refreshSentence}
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
