import React from 'react';
import { Button, Typography, Box } from '@mui/material';
import { vars } from "../../theme/variables";
const { titleFontColor } = vars;

const NoResultField = ({
  noResultReason
}: any) => {
  return (
    <Box
      width={1}
      px={2}
      textAlign='center'
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        flex: 1
      }}
    >
      <Typography
        variant="h6"
        fontWeight={500}
        marginBottom={2}
        color={titleFontColor}
      >
        No result found
      </Typography>

      <Typography variant="body1" marginBottom={2}>
        {noResultReason}
      </Typography>
      <Button variant="outlined">Clear search</Button>
    </Box>
  );
};

export default NoResultField;