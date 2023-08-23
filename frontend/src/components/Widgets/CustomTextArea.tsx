import * as React from "react";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import { styled } from "@mui/material";

const StyledInput = styled(TextField)(({ theme }) => ({
  "& .MuiInputBase-root": {
    boxShadow: 'none',
    border:0,
    "& .MuiOutlinedInput-notchedOutline": {
      border: 0,
    },
    "& .Mui-focused, &:focus-visible": {
      border: '0 !important',
      boxShadow: 'none',
      borderShadow: 'none',
    },

  },
}));


export default function TextArea({ id, value, placeholder, required, disabled, onChange, onBlur, onFocus, options: { rows } }: any) {


  return (
    <FormControl variant="standard">
      <StyledInput
      value={value?value:''}
      multiline
      rows={rows}
      placeholder={placeholder}
      fullWidth
      required={required}
      onChange={(e)=>onChange(e.target.value)}
      onBlur={(e)=>onBlur(id,e.target.value)}
      onFocus={(e)=>onFocus(id,e.target.value)}
      disabled={disabled}
      />
    </FormControl>
  );
}
