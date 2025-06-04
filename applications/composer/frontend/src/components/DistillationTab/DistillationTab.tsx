import React from "react";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import SentenceForm from "../Forms/SentenceForm";
import StatementForm from "../Forms/StatementForm";
import Paper from "@mui/material/Paper";
import SentenceStatementWithDois from "../SentenceStatementWithDois";
import StatementAlertsAccordion from "./StatementAlertsAccordion";
import { useSectionStyle, useGreyBgContainer } from "../../styles/styles";
import { useTheme } from "@mui/system";
import StatementDetailsAccordion from "../TriageStatementSection/StatementDetailsAccordion";
import ProvenancesForm from "../Forms/ProvenanceForm";
import StatementPreviewForm from "../Forms/StatementPreviewForm";
import { Accordion, AccordionDetails, AccordionSummary } from "@mui/material";
import { ExpandMore } from "@mui/icons-material";

const DistillationTab = ({
                           statement,
                           setStatement,
                           refreshStatement,
                           refs,
                           isDisabled,
                         }: any) => {
  const theme = useTheme();
  const sectionStyle = useSectionStyle(theme);
  const greyBgContainer = useGreyBgContainer(theme);
  
  return (
    <Grid container mb={2} spacing={2}>
      <Grid item xs={12}>
        <Box>
          <Paper sx={sectionStyle}>
            <Typography variant="h5" mb={3}>
              Knowledge Statement
            </Typography>
            <Box
              sx={{
                paddingLeft: "8px",
                "& .MuiGrid-container": { mt: "0 !important" },
                "& .MuiGrid-item": { pt: 0 },
              }}
            >
              <Typography variant="h6" mb={0}>
                Statement Preview
              </Typography>
              <StatementPreviewForm statement={statement} />
            </Box>
            <Box sx={greyBgContainer}>
              <Paper sx={{ ...sectionStyle, p: 0 }}>
                <StatementForm
                  statement={statement}
                  format="small"
                  action={refreshStatement}
                  extraData={{ sentence_id: statement.sentence.id }}
                  uiFields={["knowledge_statement"]}
                  className="ks"
                  enableAutoSave={true}
                  isDisabled={isDisabled}
                />
                <ProvenancesForm
                  provenancesData={statement.provenances}
                  extraData={{ connectivity_statement_id: statement.id }}
                  setter={refreshStatement}
                  className="provenance"
                  isDisabled={isDisabled}
                />
                <Box ref={refs[2]}>
                  <StatementDetailsAccordion
                    setter={refreshStatement}
                    index={0}
                    statement={statement}
                    sentence={statement.sentence}
                    isDisabled={isDisabled}
                  />
                </Box>
                <StatementAlertsAccordion
                  statement={statement}
                  setStatement={setStatement}
                  refreshStatement={refreshStatement}
                  isDisabled={isDisabled}
                />
                <Box px={2} py={0.5}>
                      <Accordion
                        elevation={0}
                        sx={{
                          "&:before": {
                            display: "none",
                          },
                        }}
                      >
                        <AccordionSummary
                          expandIcon={<ExpandMore />}
                          aria-controls="panel1bh-content"
                          className="panel1bh-header"
                          sx={{ p: 0, display: "flex", flexDirection: "row-reverse" }}
                        >
                          <Typography variant="h6" ml={1}>
                            Statement Triples
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ px: 4, pt: 0, pb: 2 }}>
                        <StatementForm
                            statement={statement}
                            format="small"
                            action={refreshStatement}
                            extraData={{ sentence_id: statement.sentence.id }}
                            uiFields={["statement_triples"]}
                            className="ks"
                            enableAutoSave={true}
                            isDisabled={isDisabled}
                          />
                        </AccordionDetails>
                      </Accordion>
                  </Box>
              </Paper>
            </Box>
          </Paper>
        </Box>
      </Grid>

      <Grid item xs={12}>
        <SentenceStatementWithDois
          statement={statement}
          setStatement={setStatement}
          refreshStatement={refreshStatement}
        />
      </Grid>

      <Grid item xs={12}>
        <Box ref={refs[1]}>
          <SentenceForm
            data={statement.sentence}
            format="small"
            isDisabled={true}
          />
        </Box>
      </Grid>
    </Grid>
  );
};

export default DistillationTab;
