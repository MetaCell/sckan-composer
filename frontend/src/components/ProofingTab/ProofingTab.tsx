import React from "react";
import { Grid, Typography, Box, Stack, Divider, Paper } from "@mui/material";
import StatementChart from "./StatementChart";
import StatementWithProvenances from "../StatementWithProvenances";
import CheckDuplicates from "../CheckForDuplicates/CheckDuplicatesDialog";
import { useSectionStyle, useGreyBgContainer } from "../../styles/styles";
import { useTheme } from "@mui/system";
import PathsBuilder from "./PathsBuilder";
import StatementPreviewForm from "../Forms/StatementPreviewForm";

const ProofingTab = (props: any) => {
  const { statement, refreshStatement, setStatement, refs, isDisabled } = props;
  const theme = useTheme();
  const sectionStyle = useSectionStyle(theme);
  const greyBgContainer = useGreyBgContainer(theme);

  const hasJourney = statement.journey != null;

  return (
    <Grid container mb={2} spacing={2}>
      <Grid item xs={12}>
        <Box>
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
                Knowledge Statement
              </Typography>
              <CheckDuplicates />
            </Stack>
            <Box
              sx={{
                paddingLeft: "8px",
                "& .MuiGrid-container": { mt: "0 !important" },
                "& .MuiGrid-item": { pt: 0 },
              }}
            >
              <Typography variant="h6" mb={0}>
                Statement Preview
              </Typography>
              <StatementPreviewForm statement={statement} />
            </Box>
            <Box sx={greyBgContainer}>
              <StatementWithProvenances
                statement={statement}
                refreshStatement={refreshStatement}
                setStatement={setStatement}
                isDisabled={isDisabled}
              />
            </Box>
          </Paper>
        </Box>
      </Grid>
      <Grid item xs={12}>
        <PathsBuilder {...props} refs={refs} isDisabled={isDisabled} />
      </Grid>

      <Grid item xs={12}>
        <Box ref={refs[6]}>
          <Paper sx={sectionStyle}>
            <Stack spacing={2}>
              <Typography variant="h5">Population Diagram</Typography>
              <StatementChart statement={statement} />
            </Stack>
            {hasJourney && (
              <>
                <Box my={2}>
                  <Divider />
                </Box>
                <Stack spacing={2}>
                  <Typography variant="h5">Journey</Typography>
                    {statement.journey.map((journeyStep: string, index: number) => {
                      if (index === 0 && index === statement.journey.length - 1) {
                          return <>{journeyStep.charAt(0).toUpperCase() + journeyStep.slice(1)}. </>;
                      } else if (index === 0) {
                        return <>{journeyStep.charAt(0).toUpperCase() + journeyStep.slice(1)}; </>;
                      } else {
                        if (index === statement.journey.length - 1) {
                          return <>{journeyStep}.</>;
                        } else {
                          return <>{journeyStep}; </>;
                        }
                      }
                    })}
                </Stack>
              </>
            )}
          </Paper>
        </Box>
      </Grid>
    </Grid>
  );
};

export default ProofingTab;
