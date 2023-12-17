import React, { useState } from "react";
import { Paper, Stack, Typography, Divider, Box } from "@mui/material";
import { useTheme } from "@emotion/react";
import { useSectionStyle, useGreyBgContainer } from "../../styles/styles";
import StatementForm from "../Forms/StatementForm";
import { vars } from "../../theme/variables";
import { OriginIcon } from "../icons";

const PathsBuilder = (props: any) => {
  const { statement, refreshStatement, refs } = props;
  const theme = useTheme();
  const sectionStyle = useSectionStyle(theme);
  const subSectionStyle = useGreyBgContainer(theme);

  return (
    <Box style={{ position: "relative" }}>
      <Paper sx={{ ...sectionStyle, px: 0, position: "relative", zIndex: 2 }}>
        <Typography variant="h5" sx={{ px: 3, pb: 2 }}>
          Path Builder
        </Typography>
        <Divider />
        <Stack sx={{ px: 1.5, mt: 1.5, width: 1 }}>
          <Box sx={subSectionStyle} ref={refs[3]}>
            <Typography
              variant="subtitle1"
              color={vars.captionColor}
              ml={1}
              mb={1}
            >
              Origin
            </Typography>
            <Box
              sx={{
                ...sectionStyle,
                padding: ".75rem .88rem .75rem .50rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Stack direction="row" alignItems="center" flex={1}>
                <OriginIcon
                  fill="#475467"
                  style={{ marginRight: ".5rem", width: "2rem" }}
                />
                <Typography color="#667085" fontWeight={500}>
                  Soma
                </Typography>
              </Stack>
              <StatementForm
                {...props}
                statement={statement}
                format="noLabel"
                refreshStatement={refreshStatement}
                extraData={{ sentence_id: statement.sentence.id }}
                uiFields={["origins"]}
                enableAutoSave={false}
                submitOnChangeFields={["origins"]}
                className="origins"
              />
            </Box>
          </Box>
          <Box height={24} width={2} bgcolor="#D0D5DD" ml="34px" />
          <Box sx={subSectionStyle} ref={refs[4]}>
            <Typography variant="subtitle1" color={vars.captionColor} ml={1}>
              Via
            </Typography>
            <StatementForm
              {...props}
              statement={statement}
              format="noLabel"
              refreshStatement={refreshStatement}
              extraData={{ sentence_id: statement.sentence.id }}
              uiFields={["vias"]}
              enableAutoSave={false}
              className="vias"
            />
          </Box>
          <Box
            height={24}
            width={2}
            bgcolor="#D0D5DD"
            ml="34px"
            ref={refs[5]}
          />
          <Box sx={subSectionStyle}>
            <Typography variant="subtitle1" color={vars.captionColor} ml={1}>
              Destination
            </Typography>
            <StatementForm
              {...props}
              statement={statement}
              format="noLabel"
              refreshStatement={refreshStatement}
              extraData={{ sentence_id: statement.sentence.id }}
              uiFields={["destinations"]}
              enableAutoSave={false}
              className="vias"
            />
          </Box>
          <Box height={24} width={2} bgcolor="#D0D5DD" ml="34px" />
          <Box sx={subSectionStyle}>
            <Typography
              variant="subtitle1"
              color={vars.captionColor}
              ml={1}
              mb={1}
            >
              Forward connection(s)
            </Typography>
            <Box
              sx={{ ...sectionStyle, padding: ".75rem .88rem .75rem .50rem" }}
            >
              <StatementForm
                statement={statement}
                format="small"
                refreshStatement={refreshStatement}
                extraData={{ sentence_id: statement.sentence.id }}
                uiFields={["forward_connection"]}
                enableAutoSave={true}
                className="ks"
              />
            </Box>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
};

export default PathsBuilder;
