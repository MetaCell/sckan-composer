import React, { useEffect, useState } from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import statementService from "../services/StatementService";
import SentenceForm from "../components/Forms/SentenceForm";
import SpeciesForm from "../components/Forms/SpeciesForm";
import StatementForm from "../components/Forms/StatementForm";
import Paper from "@mui/material/Paper";

const DistillationTab = ({ statement, setStatement } : any) => {

  return (
    <Grid container mb={2} spacing={2}>
      <Grid item xs={12}>
        <Paper>
          <Typography variant="h5" mb={1}>
            Knowledge Statements
          </Typography>
        </Paper>
      </Grid>

      <Grid item xs={12}>
        <SentenceForm
          data={statement.sentence}
          format="small"
        />
      </Grid>

      <Grid item xs={12}>
        <Paper>
          <Typography variant="h5" mb={1}>
            Statements Details
          </Typography>
          <SpeciesForm
            data={statement.species}
            extraData={{ parentId: statement.id, service: statementService }}
            setter={setStatement}
          />
          <StatementForm
            statement={statement}
            format="small"
            setter={setStatement}
            extraData={{
              statement_id: statement.id,
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
        </Paper>
      </Grid>
    </Grid>
  );
};

export default DistillationTab;
