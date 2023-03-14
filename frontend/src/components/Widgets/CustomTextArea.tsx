import * as React from "react";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import {useDebouncedCallback} from "use-debounce";
import {EDIT_DEBOUNCE} from "../../settings";


export default function TextArea({value, placeholder,onChange, options: { rows } }: any) {

  const debouncedChangeHandler = useDebouncedCallback(
    (event) => onChange(event.target.value),
    EDIT_DEBOUNCE
  );

  return (
    <FormControl variant="standard">
    <TextField
      defaultValue={value}
      multiline
      rows={rows}
      placeholder={placeholder}
      fullWidth
      onChange={debouncedChangeHandler}
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
    </FormControl>
  );
}
