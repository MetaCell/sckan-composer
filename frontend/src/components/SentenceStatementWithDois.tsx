import React  from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import {Box} from "@mui/material";
import StatementWithProvenances from "./StatementWithProvenances";
import { useSectionStyle } from "../styles/styles";
import { useTheme } from "@mui/system";

const SentenceStatementWithDois = ({ statement, refreshStatement } : any) => {
  const theme = useTheme()
  const sectionStyle = useSectionStyle(theme)

  const openStatement = (statement: any) => {
    window.location.href = (`/statement/${statement?.id}`)
  }

  const otherStatements = statement?.sentence?.connectivity_statements.filter((row: any) => row?.id !== statement?.id)
  
  if (otherStatements.length === 0){
    return null
  }

  return (
    <Paper sx={sectionStyle}>
      <Typography variant="h5" mb={3}>
        Other Knowledge Statements
      </Typography>
      <Stack spacing={2}>
        <Typography>Knowledge Statements from the same input Sentence</Typography>
        {
          otherStatements?.map((row: any )=>
            <Stack
              key={row.id}
              direction={{ xs: 'column', sm: 'row' }}
              spacing={{ xs: 1, sm: 2 }}
              alignItems='center'
            >
              <StatementWithProvenances background={"#F9FAFB"} statement={row} refreshStatement={refreshStatement} disabled/>
              <Box>
                <OpenInNewIcon
                  onClick={() => openStatement(row)}
                  sx={{
                    color: '#98A2B3',
                    fontSize: '1rem',
                    cursor: 'pointer'
                  }} />
              </Box>
            </Stack>
          )
        }
      </Stack>
    </Paper>
  );
};

export default SentenceStatementWithDois;
