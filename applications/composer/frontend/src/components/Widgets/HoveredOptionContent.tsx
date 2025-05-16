import React from "react";
import { Stack, Typography, Box, Chip } from "@mui/material";
import { OptionDetail } from "../../types";
import { DROPDOWN_MAPPER_ONTOLOGY_URL, DROPDOWN_MAPPER_LAYER_URI, DROPDOWN_MAPPER_REGION_URI } from "../../helpers/anatomicalEntityHelper";
import { snakeToSpace } from "../../helpers/helpers";

export const CustomFooter = ({ entity }: any) => {
  const ontologyUrlDetails = entity.content.filter(
    (detail: OptionDetail) => [DROPDOWN_MAPPER_ONTOLOGY_URL, DROPDOWN_MAPPER_LAYER_URI, DROPDOWN_MAPPER_REGION_URI].includes(detail.title),
  );
  const ontologyUrls = ontologyUrlDetails.map((detail: OptionDetail) => detail.value || "URL not available");

  return (
    <Box
      sx={{
        mt: "1.5rem",
        display: "flex",
        gap: 1,
        flexWrap: "wrap",
        pt: "1.5rem",
        borderTop: "0.0625rem solid #F2F4F7",
      }}
    >
      {
        ontologyUrls.map((url: string) => (
          <Chip variant="outlined" label={url} />
        ))
      }
    </Box>
  );
};
const DefaultBody = ({ entity }: any) => {
  return (
    <Stack spacing={2} flexGrow={1}>
      {entity?.content?.map((detail: any, i: number) => {
        const value =
          detail?.title === "state"
            ? snakeToSpace(detail?.value)
            : detail?.value;
        return (
          <Stack spacing={1} sx={{ mt: i !== 0 ? 3 : 0 }}>
            <Typography variant="body1">{detail?.title}</Typography>
            <Typography variant="body2">{value}</Typography>
          </Stack>
        );
      })}
    </Stack>
  );
};

const HoveredOptionContent = ({
  entity,
  HeaderComponent,
  BodyComponent,
  FooterComponent,
}: any) => {
  return (
    <Box
      width={1}
      p={3}
      display="flex"
      flexDirection="column"
      minHeight={1}
      sx={{
        "& .MuiTypography-body1": {
          color: "#A9ACB2",
          fontSize: "0.75rem",
          fontWeight: 500,
          lineHeight: "1.125rem",
        },

        "& .MuiTypography-body2": {
          color: "#373A3E",
          fontSize: "0.875rem",
          fontWeight: 400,
          lineHeight: "1.25rem",
          marginTop: "0.25rem",
        },

        "& .MuiChip-root": {
          color: "#344054",
          fontSize: "0.875rem",
          fontWeight: 500,
          lineHeight: "1.25rem",
          borderRadius: "0.375rem",
          borderColor: "#D0D5DD",
          padding: "0.125rem 0",
          "&.MuiChip-filledSuccess": {
            background: "#ECFDF3",
            borderRadius: "1rem",
            color: "#027A48",
          },
          "&.MuiChip-filledError": {
            background: "#FEF3F2",
            borderRadius: "1rem",
            color: "#B42318",
          },
          "& .MuiChip-label": {
            p: "0 0.5625rem",
          },
        },
      }}
    >
      {HeaderComponent && <HeaderComponent entity={entity} />}
      {BodyComponent ? (
        <BodyComponent entity={entity} />
      ) : (
        <DefaultBody entity={entity} />
      )}
      {FooterComponent && <FooterComponent entity={entity} />}
    </Box>
  );
};

export default HoveredOptionContent;
