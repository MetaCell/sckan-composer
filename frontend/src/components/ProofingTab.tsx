import React from "react";
import { ConnectivityStatement } from "../apiclient/backend/api";
import { Grid, Typography, Box, Stack, Divider, Paper } from "@mui/material";
import StatementChart from "./StatementChart/StatementChart";
import StatementWithDois from "./StatementWithDois";
import CheckDuplicates from "./CheckForDuplicates/CheckDuplicatesDialog";
import { useSectionStyle } from "../styles/styles";
import { useTheme } from "@mui/system";

const ProofingTab = (props: { statement: ConnectivityStatement }) => {
  const { statement } = props;
  const theme = useTheme()
  const sectionStyle = useSectionStyle(theme)

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
            <StatementWithDois statement={statement} />
          </Box>
        </Paper>
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
                <Typography variant="h4">Journey</Typography>
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
