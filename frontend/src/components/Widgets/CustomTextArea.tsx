import * as React from "react";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import {useDebouncedCallback} from "use-debounce";
import {EDIT_DEBOUNCE} from "../../settings";
import { styled } from "@mui/material";

const StyledInput = styled(TextField)(({ theme }) => ({
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

}));


export default function TextArea({value, placeholder, required, onChange, options: { rows, hasDebouncedOnChange } }: any) {

  const debouncedChangeHandler = useDebouncedCallback(
    (event) => onChange(event.target.value),
    EDIT_DEBOUNCE
  );

  return (
    <FormControl variant="standard">
      {hasDebouncedOnChange
      ? <StyledInput  defaultValue={value}
      multiline
      rows={rows}
      placeholder={placeholder}
      fullWidth
      required={required}
      onChange={debouncedChangeHandler}/>
      :<StyledInput
      value={value?value:''}
      multiline
      rows={rows}
      placeholder={placeholder}
      fullWidth
      required={required}
      onChange={(e)=>onChange(e.target.value)}
      />
      }

    </FormControl>
  );
}
