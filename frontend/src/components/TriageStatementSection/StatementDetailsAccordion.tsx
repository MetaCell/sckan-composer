import React from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import StatementForm from "../Forms/StatementForm";
import SpeciesForm from "../Forms/SpeciesForm";
import statementService from '../../services/StatementService'

const StatementDetailsAccordion = (props: any) => {
  const {
    index,
    statement,
    setter,
    sentence,
  } = props;

  const [expanded, setExpanded] = React.useState<string | false>("panel-0");

  const handleChange =
    (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };
  return (
    <Accordion
      expanded={expanded === `panel-${index}`}
      onChange={handleChange(`panel-${index}`)}
      elevation={0}
      sx={{
        '&:before': {
            display: 'none',
        }
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls="panel1bh-content"
        className="panel1bh-header"
        sx={{p:0, display:'flex', flexDirection:'row-reverse'}}
      >
        <Typography variant="h6" ml={1}>Statement Details</Typography>
      </AccordionSummary>
      <AccordionDetails sx={{px:4, py:0}}>
      <SpeciesForm
          data={statement.species}
          extraData={{ parentId: statement.id, service: statementService }}
          setter={setter}
        />
        <StatementForm
          statement={statement}
          format="small"
          setter={setter}
          extraData={{
            sentence_id: sentence.id,
            knowledge_statement: statement.knowledge_statement,
          }}
          uiFields={[
            "sex_id",
            "apinatomy_model",
            "circuit_type",
            "laterality",
            "projection",
            "phenotype_id",
          ]}
        />
      </AccordionDetails>
    </Accordion>
  );
};

export default StatementDetailsAccordion;
