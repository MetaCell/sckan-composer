import * as React from "react";
import TextField from "@mui/material/TextField";

export default function TextArea({value, placeholder,onChange, options: { rows } }: any) {

  return (
    <TextField
      value={value}
      multiline
      rows={rows}
      placeholder={placeholder}
      fullWidth
      onChange={(event) => onChange(event.target.value)}
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
