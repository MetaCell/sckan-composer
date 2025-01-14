import React from "react";
import { Box } from "@mui/material";
import StatementForm from "./Forms/StatementForm";

const StatementWithProvenances = ({ statement, background = "#fff", refreshStatement, isDisabled }: any) => {


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
        action={refreshStatement}
        extraData={{ sentence_id: statement.sentence_id }}
        uiFields={["knowledge_statement"]}
        className='ks'
        isDisabled={isDisabled}
        enableAutoSave={true}
      />

      {/*<ProvenancesForm*/}
      {/*  provenancesData={statement.provenances}*/}
      {/*  extraData={{ connectivity_statement_id: statement.id }}*/}
      {/*  setter={refreshStatement}*/}
      {/*  className='provenance'*/}
      {/*  isDisabled={isDisabled}*/}
      {/*/>*/}
    </Box>
  );
};

export default StatementWithProvenances;
