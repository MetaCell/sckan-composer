import * as React from "react";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import { styled } from "@mui/material";
import Typography from "@mui/material/Typography";
import { vars } from "../../theme/variables";

const StyledInput = styled(TextField)(({ theme }) => ({
  "label + &": {
    marginTop: theme.spacing(4),
  },
  "& .MuiOutlinedInput-notchedOutline": {
    border: 0,
  },
}));

export default function CustomTextField({
  id,
  value,
  placeholder,
  onChange,
  onBlur,
  onFocus,
  options: { label, multiline, rows , isDisabled, onBlur2},
}: any) {
  const updatedValue = value && typeof value === 'object' ? value.value : value;
  return (
    <FormControl variant="standard">
        <Typography variant="h6" fontWeight={500} marginBottom={2} color={vars.titleFontColor}>
          {label}
        </Typography>
      {
        isDisabled ? <Typography>{updatedValue ? updatedValue : '-'}</Typography> : <StyledInput
          onChange={(event) => onChange(event.target.value)}
          id="custom-input"
          placeholder={placeholder}
          multiline={multiline}
          rows={rows}
          value={updatedValue ? updatedValue : ''}
          disabled={isDisabled}
          onBlur={(e=>{
            if (onBlur2) {
              onBlur2(e.target.value);
            }
            onBlur(id,e.target.value)
          })}
          onFocus={(e=>onFocus(id,e.target.value))}
        />
      }
      
    </FormControl>
  );
}
