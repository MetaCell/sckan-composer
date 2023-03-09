import * as React from "react";
import TextField from "@mui/material/TextField";
import InputLabel  from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import {styled} from "@mui/material";
import Typography from "@mui/material/Typography";

const StyledInput = styled(TextField)(({ theme }) => ({
  'label + &': {
    marginTop: theme.spacing(4),
  },
  '& .MuiOutlinedInput-notchedOutline': {
    border: 0
  }
}));

export default function CustomTextField({placeholder,onChange,  options: { label } }: any) {

  return (
      <FormControl variant="standard">
        <InputLabel shrink htmlFor="custom-input">
          <Typography variant="h5" fontWeight={500}>{label}</Typography>
        </InputLabel>
        <StyledInput
          onChange={(event) => onChange(event.target.value)}
          id='custom-input' placeholder={placeholder} />
      </FormControl>

  );
}