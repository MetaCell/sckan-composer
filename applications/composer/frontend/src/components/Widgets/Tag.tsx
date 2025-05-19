import React from "react";
import { Typography, Box } from "@mui/material";
import { vars } from "../../theme/variables";

const Tag = (props: { label: string }) => {
  const { label } = props;
  return (
    <Box px={1} borderRadius="6px" border="1px solid #D0D5DD">
      <Typography
        variant="caption"
        color={vars.buttonOutlinedColor}
        noWrap
        display="-webkit-box"
      >
        {label}
      </Typography>
    </Box>
  );
};

export default Tag;
