import React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

const Header = (props: any) => {
  const { title, caption, actions } = props;

  return (
    <Box mb={5} display="flex" justifyContent="space-between">
      <Box>
        <Typography variant="h3" mb={0.5}>
          {title}
        </Typography>
        <Typography variant="body2">{caption}</Typography>
      </Box>
      <Box>
        {actions.map((a: any, i: any) => (
          <Button variant="contained" key={i} startIcon={<a.icon />}>
            {a.label}
          </Button>
        ))}
      </Box>
    </Box>
  );
};

export default Header;
