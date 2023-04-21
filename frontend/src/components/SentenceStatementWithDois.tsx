import React  from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import {Box} from "@mui/material";
import Divider from "@mui/material/Divider";
import {useNavigate} from "react-router";
import StatementWithProvenances from "./StatementWithProvenances";
import { useSectionStyle } from "../styles/styles";
import { useTheme } from "@mui/system";

const SentenceStatementWithDois = ({ statement } : any) => {
  const navigate = useNavigate();
  const theme = useTheme()
  const sectionStyle = useSectionStyle(theme)

  const openStatement = (statement: any) => {
    navigate(`/statement/${statement?.id}`, {
      replace: false
    })
  }

  const otherStatements = statement?.sentence?.connectivity_statements.filter((row: any) => row?.id !== statement?.id)
  return (
    <Paper sx={sectionStyle}>
      <Typography variant="h5" mb={3}>
        Knowledge Statements
      </Typography>
      <Box sx={{
        background: '#F2F4F7',
        borderRadius: '12px',
        padding: '8px !important',
        textAlign: 'center',
      }}>
        <StatementWithProvenances statement={statement} />
      </Box>
      <Divider sx={{margin: '24px 0'}}>Records from the same NLP Sentence</Divider>
      <Stack spacing={2}>
        {
          otherStatements?.map((row: any )=>
            <Stack
              key={row.id}
              direction={{ xs: 'column', sm: 'row' }}
              spacing={{ xs: 1, sm: 2 }}
              alignItems='center'
            >
              <StatementWithProvenances background={"#F9FAFB"} statement={row} />
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
