import React from "react";
import { ConnectivityStatement } from "../apiclient/backend/api";
import { Grid, Typography, Box, Stack, Divider } from "@mui/material";
import StatementChart from "./StatementChart/StatementChart";
import { useTheme } from "@mui/system";
import { useSectionStyle } from "../styles/styles";

const ProofingTab = (props: { statement: ConnectivityStatement }) => {
  const { statement } = props;
  const theme = useTheme();
  const sectionStyle = useSectionStyle(theme);
  return (
    <Grid container justifyContent="space-between">
      <Grid item xl={12} py={3} sx={sectionStyle}>
        <Stack spacing={2} px={3}>
          <Typography variant="h4">Statement preview</Typography>
          <StatementChart statement={statement} />
        </Stack>
        <Box my={2}>
          <Divider />
        </Box>
        <Stack spacing={2} px={3}>
          <Typography variant="h4">Journey</Typography>
          <Typography>
            {statement.origin && statement.destination && statement.journey}
          </Typography>
        </Stack>
      </Grid>
    </Grid>
  );
};

export default ProofingTab;
