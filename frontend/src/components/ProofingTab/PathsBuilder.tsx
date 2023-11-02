import React from "react";
import { Paper, Stack, Typography, Divider, Grid, Box, Table, TableBody } from "@mui/material";
import { useTheme } from "@emotion/react";
import { useSectionStyle, useGreyBgContainer } from "../../styles/styles";
import StatementForm from "../Forms/StatementForm";
import TableRow from "./TableRow";
import { vars } from "../../theme/variables";
import OutlinedFlagTwoToneIcon from '@mui/icons-material/OutlinedFlagTwoTone';
import FmdGoodOutlinedIcon from '@mui/icons-material/FmdGoodOutlined';

const PathsBuilder = (props: any) => {
  const { statement,  refreshStatement } = props;
  const theme = useTheme();
  const sectionStyle = useSectionStyle(theme);
  const subSectionStyle = useGreyBgContainer(theme)
  return (
    <Paper sx={{ ...sectionStyle, px: 0 }}>
        <Typography variant="h5" sx={{ px: 3, pb: 2 }}>
          Path Builder
        </Typography>
        <Divider/>
      <Stack sx={{ px: 1.5, mt:1.5}}>
        <Box sx={subSectionStyle}>
          <Typography variant="subtitle1" color={vars.captionColor} sx={{mb:1, pl:1}}>Origin</Typography>
          <Table>
            <TableBody>
              <TableRow  startIcon={<OutlinedFlagTwoToneIcon/>}>
                <Grid
                  container
                  columnSpacing={2}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    alignItems: "center",
                    "& .MuiGrid-container": { mt: "0 !important" },
                    "& .MuiGrid-item": { pt: 0, mb: "0 !important" },
                  }}
                >
                  <Grid item>
                    <Typography>Origin</Typography>
                  </Grid>
                  <Grid item>
                    <StatementForm
                      {...props}
                      statement={statement}
                      format="noLabel"
                      setter={refreshStatement}
                      extraData={{ sentence_id: statement.sentence.id }}
                      uiFields={["origin_id"]}
                      enableAutoSave={false}
                      submitOnChangeFields={['origin_id']}
                    />
                  </Grid>
                </Grid>
              </TableRow>
            </TableBody>
          </Table>
        </Box>
        <Box height={24} width={2} bgcolor='#D0D5DD' ml='34px'/>
        <Box sx={subSectionStyle}>
        <Typography variant="subtitle1" color={vars.captionColor} sx={{ pl:1}} >Vias</Typography>
        <StatementForm
          {...props}
          statement={statement}
          setter={refreshStatement}
          extraData={{ sentence_id: statement.sentence.id }}
          uiFields={["path"]}
          className="vias"
          enableAutoSave={false}
          submitOnChangeFields={['path']}
        />
        </Box>
        <Box height={24} width={2} bgcolor='#D0D5DD' ml='34px'/>
        <Box sx={subSectionStyle}>
          <Typography variant="subtitle1" color={vars.captionColor} sx={{mb:1, pl:1}}>Destination</Typography>
          <Table>
            <TableBody>
              <TableRow  startIcon={<FmdGoodOutlinedIcon/>}>
                <StatementForm
                  {...props}
                  statement={statement}
                  format="noLabel"
                  setter={refreshStatement}
                  extraData={{ sentence_id: statement.sentence.id }}
                  uiFields={["destination_id", "destination_type"]}
                  className="inLineForm"
                  enableAutoSave={false}
                  submitOnChangeFields={["destination_id", "destination_type"]}
                />
              </TableRow>
            </TableBody>
          </Table>
        </Box>
      </Stack>
    </Paper>
  );
};

export default PathsBuilder;
