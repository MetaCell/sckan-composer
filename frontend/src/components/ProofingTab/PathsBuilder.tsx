import React from "react";
import {
  Paper,
  Stack,
  Typography,
  Divider,
  Grid,
  Box,
  Table,
  TableBody,
} from "@mui/material";
import { useTheme } from "@emotion/react";
import { useSectionStyle, useGreyBgContainer } from "../../styles/styles";
import StatementForm from "../Forms/StatementForm";
import TableRow from "./TableRow";
import { vars } from "../../theme/variables";
import OutlinedFlagTwoToneIcon from "@mui/icons-material/OutlinedFlagTwoTone";
import FmdGoodOutlinedIcon from "@mui/icons-material/FmdGoodOutlined";

const PathsBuilder = (props: any) => {
  const { statement, refreshStatement, refs } = props;
  const theme = useTheme();
  const sectionStyle = useSectionStyle(theme);
  const subSectionStyle = useGreyBgContainer(theme);
  return (
    <Paper sx={{ ...sectionStyle, px: 0 }}>
      <Typography variant="h5" sx={{ px: 3, pb: 2 }}>
        Path Builder
      </Typography>
      <Divider />
      <Stack sx={{ px: 1.5, mt: 1.5, width: 1 }}>
        <Box sx={subSectionStyle} ref={refs[5]}>
          <Typography variant="subtitle1" color={vars.captionColor}>
            Origin
          </Typography>
          <Box sx={{ ...sectionStyle, padding: ".75rem .88rem .75rem .50rem" }}>
            <StatementForm
              {...props}
              statement={statement}
              format="noLabel"
              setter={refreshStatement}
              extraData={{ sentence_id: statement.sentence.id }}
              uiFields={["origins"]}
              enableAutoSave={false}
              submitOnChangeFields={["origins"]}
              className="ks"
            />
          </Box>
        </Box>
        <Box height={24} width={2} bgcolor="#D0D5DD" ml="34px" />
        <Box sx={subSectionStyle} ref={refs[5]}>
          <Typography variant="subtitle1" color={vars.captionColor}>
            Vias
          </Typography>

          <StatementForm
            {...props}
            statement={statement}
            format="noLabel"
            setter={refreshStatement}
            extraData={{ sentence_id: statement.sentence.id }}
            uiFields={["vias"]}
            enableAutoSave={false}
            submitOnChangeFields={["vias"]}
            className="vias"
          />
        </Box>
        <Box height={24} width={2} bgcolor="#D0D5DD" ml="34px" />
        <Box sx={subSectionStyle} ref={refs[5]}>
          <Typography variant="subtitle1" color={vars.captionColor}>
            Destination
          </Typography>
          <StatementForm
            {...props}
            statement={statement}
            format="noLabel"
            setter={refreshStatement}
            extraData={{ sentence_id: statement.sentence.id }}
            uiFields={["destinations"]}
            enableAutoSave={false}
            submitOnChangeFields={["destinations"]}
            className="vias"
          />
        </Box>
        <Box height={24} width={2} bgcolor="#D0D5DD" ml="34px" />
        <Box sx={subSectionStyle}>
          <Typography variant="subtitle1" color={vars.captionColor}>
            Forward connections(s)
          </Typography>
          <Box sx={{ ...sectionStyle, padding: ".75rem .88rem .75rem .50rem" }}>
            <StatementForm
              statement={statement}
              format="small"
              setter={refreshStatement}
              extraData={{ sentence_id: statement.sentence.id }}
              uiFields={["forward_connection"]}
              enableAutoSave={true}
              className="ks"
            />
          </Box>
        </Box>
      </Stack>
    </Paper>
  );
};

export default PathsBuilder;
