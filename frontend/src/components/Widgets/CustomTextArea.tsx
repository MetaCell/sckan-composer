import * as React from "react";
import TextField from "@mui/material/TextField";

export default function TextArea({placeholder, options: { rows } }: any) {

  return (
    <TextField
      multiline
      rows={rows}
      placeholder={placeholder}
      fullWidth
      sx={{
        "& .Mui-focused": {
          border: '0 !important',
          boxShadow: 'none',
          borderShadow: 'none',
        },
        "& .MuiInputBase-root": {
          border: 0,
          boxShadow: 'none',

          "& .MuiOutlinedInput-notchedOutline": {
            border: 0,
            boxShadow: 'none',
          },
          "& .Mui-focused, &:focus-visible": {
            border: '0 !important',
            boxShadow: 'none',
            borderShadow: 'none',
          },

        },

      }}
    />
  );
}
