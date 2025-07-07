import { ExpandMore } from "@mui/icons-material";
import { Accordion, AccordionDetails, AccordionSummary, Box, Typography } from "@mui/material";
import StatementForm from "./StatementForm";

const StatementTriples = ({ statement, refreshStatement, isDisabled }: any) => {
  return (
    <Box px={2} py={0.5}>
    <Accordion
      elevation={0}
      sx={{
        "&:before": {
          display: "none",
        },
        "& #root_statement_triples__title": {
         display: "none",
        }
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMore />}
        aria-controls="panel1bh-content"
        className="panel1bh-header"
        sx={{ p: 0, display: "flex", flexDirection: "row-reverse" }}
      >
        <Typography variant="h6" ml={1}>
          Additional Details
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
  );
};

export default StatementTriples;
