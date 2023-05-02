import React from "react";
import { Grid, Typography, Box, Stack, Divider, Paper } from "@mui/material";
import StatementChart from "./StatementChart";
import StatementWithProvenances from "../StatementWithProvenances";
import CheckDuplicates from "../CheckForDuplicates/CheckDuplicatesDialog";
import { useSectionStyle } from "../../styles/styles";
import { useTheme } from "@mui/system";
import PathsBuilder from "./PathsBuilder";

const ProofingTab = (props: any) => {
  const { statement, refreshStatement, setStatement } = props;
  const theme = useTheme();
  const sectionStyle = useSectionStyle(theme);

  const hasJourney =
    statement.origin && statement.destination && statement.path.length > 0;

  return (
    <Grid container mb={2} spacing={2}>
      <Grid item xs={12}>
        <Paper sx={sectionStyle}>
          <Stack
            direction="row"
            justifyContent="space-between"
            sx={{
              "& .MuiButtonBase-root": {
                padding: 0,
              },
            }}
          >
            <Typography variant="h5" mb={3}>
              Knowledge Statements
            </Typography>
            <CheckDuplicates />
          </Stack>
          <Box
            sx={{
              background: "#F2F4F7",
              borderRadius: "12px",
              padding: "8px !important",
              textAlign: "center",
            }}
          >
            <StatementWithProvenances statement={statement} refreshStatement={refreshStatement} setStatement={setStatement}/>
          </Box>
        </Paper>
      </Grid>
      <Grid item xs={12}>
        <PathsBuilder
          {...props}
        />
      </Grid>
      <Grid item xs={12}>
        <Paper sx={sectionStyle}>
          <Stack spacing={2}>
            <Typography variant="h5">Statement preview</Typography>
            <StatementChart statement={statement} />
          </Stack>

          {hasJourney && (
            <>
              <Box my={2}>
                <Divider />
              </Box>
              <Stack spacing={2}>
                <Typography variant="h5">Journey</Typography>
                <Typography>{statement.journey}</Typography>
              </Stack>
            </>
          )}
        </Paper>
      </Grid>
    </Grid>
  );
};

export default ProofingTab;
