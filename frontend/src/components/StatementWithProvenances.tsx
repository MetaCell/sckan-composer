import React  from "react";
import {Box} from "@mui/material";
import StatementForm from "./Forms/StatementForm";
import ProvenancesForm from "./Forms/ProvenanceForm";

const StatementWithProvenances = ({ statement, background = "#fff", refreshStatement, disabled } : any) => {


  return (
    <Box sx={{
      borderRadius: '12px',
      border: '1px solid #EAECF0',
      textAlign: 'left',
      backgroundColor: background,
      width: '100%',

      "& .MuiTypography-root": {
        padding: '12px'
      }
    }}>
          <StatementForm
            statement={statement}
            format="small"
            setter={refreshStatement}
            extraData={{ sentence_id: statement.sentence_id }}
            uiFields={["knowledge_statement"]}
            className='ks'
            disabled={disabled}
          />

          <ProvenancesForm
            provenancesData={statement.provenances}
            extraData={{ connectivity_statement_id: statement.id }}
            setter={refreshStatement}
            className='provenance'
            disabled={disabled}
          />
    </Box>
  );
};

export default StatementWithProvenances;
