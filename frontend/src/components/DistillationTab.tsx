import React  from "react";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import statementService from "../services/StatementService";
import SentenceForm from "../components/Forms/SentenceForm";
import SpeciesForm from "../components/Forms/SpeciesForm";
import StatementForm from "../components/Forms/StatementForm";
import Paper from "@mui/material/Paper";
import SentenceStatementWithDois from "./SentenceStatementWithDois";
import { useSectionStyle } from "../styles/styles";
import { useTheme } from "@mui/system";

const DistillationTab = ({ statement, setStatement, refreshStatement, disabled } : any) => {
  const theme = useTheme()
  const sectionStyle = useSectionStyle(theme)

  return (
    <Grid container mb={2} spacing={2}>
      <Grid item xs={12}>
        <SentenceStatementWithDois statement={statement} />
      </Grid>

      <Grid item xs={12}>
        <SentenceForm
          data={statement.sentence}
          format="small"
          disabled={true}
        />
      </Grid>

      <Grid item xs={12}>
        <Paper sx={sectionStyle}>
          <Typography variant="h5" mb={1}>
            Statements Details
          </Typography>
          <SpeciesForm
            data={statement.species}
            extraData={{ parentId: statement.id, service: statementService }}
            setter={refreshStatement}
            disabled={true}
          />
          <StatementForm
            disabled={disabled}
            statement={statement}
            format="small"
            setter={setStatement}
            extraData={{
              statement_id: statement.id,
              knowledge_statement: statement.knowledge_statement,
            }}
            uiFields={[
              "sex_id",
              "apinatomy_model",
              "additional_information",
              "circuit_type",
              "laterality",
              "projection",
              "phenotype_id",
            ]}
          />
        </Paper>
      </Grid>
    </Grid>
  );
};

export default DistillationTab;
