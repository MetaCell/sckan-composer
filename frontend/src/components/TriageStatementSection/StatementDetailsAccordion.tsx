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

const StatementDetailsAccordion = (props: any) => {
  const {
    index,
    divisionList,
    biologicalSex,
    statement,
    setSentence,
    sentence,
    speciesList,
  } = props;

  const [expanded, setExpanded] = React.useState<string | false>("panel-0");

  if (
    divisionList.length === 0 ||
    biologicalSex.length === 0 ||
    speciesList.length === 0
  )
    return null;

  const handleChange =
    (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };
  return (
    <Accordion
      expanded={expanded === `panel-${index}`}
      onChange={handleChange(`panel-${index}`)}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls="panel1bh-content"
        id="panel1bh-header"
      >
        <Typography>Statement Details</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <StatementForm
          divisionList={divisionList}
          biologicalSex={biologicalSex}
          statement={statement}
          format="small"
          setter={setSentence}
          extraData={{
            sentence_id: sentence.id,
            knowledge_statement: statement.knowledge_statement,
          }}
          uiFields={[
            "biological_sex_id",
            "apinatomy_model",
            "circuit_type",
            "laterality",
            "ans_division_id",
          ]}
        />
        <SpeciesForm
          speciesList={speciesList}
          data={sentence}
          extraData={{ parentId: sentence.id }}
          setter={setSentence}
        />
      </AccordionDetails>
    </Accordion>
  );
};

export default StatementDetailsAccordion;
