import * as React from "react";
import TextField from "@mui/material/TextField";
import InputLabel from "@mui/material/InputLabel";
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
  value,
  placeholder,
  onChange,
  options: { label, multiline, rows },
}: any) {
  return (
    <FormControl variant="standard">
        <Typography variant="h6" fontWeight={500} marginBottom={2} color={vars.titleFontColor}>
          {label}
        </Typography>

      <StyledInput
        onChange={(event) => onChange(event.target.value)}
        id="custom-input"
        placeholder={placeholder}
        multiline={multiline}
        rows={rows}
        value={value ? value : ''}
      />
    </FormControl>
  );
}
