import * as React from "react";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import { styled } from "@mui/material";
import {useEffect} from "react";

const StyledInput = styled(TextField)(() => ({
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


export default function TextArea({ id, value, placeholder, required, onChange, onBlur, onFocus, options: { rows, isDisabled, onBlur: customOnBlur, ref, alertId, currentExpanded, onFocus: customFocus } }: any) {
  
  const refocus = (ref: any) => {
    if (ref?.current) {
      ref.current.focus();
    }
  }
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const blurredValue = e.target.value;
    onBlur(id, blurredValue);
    if (customOnBlur) {
      customOnBlur(blurredValue, alertId);
    }
  };
  
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const focusedValue = e.target.value;
    if (customFocus) {
      customFocus(focusedValue, alertId);
    }
    onFocus(id, focusedValue);
  };
  
  useEffect(() => {
    if (alertId === currentExpanded) {
      refocus(ref);
    }
  }, [alertId, ref, currentExpanded]);
  
  useEffect(() => {
    if (ref?.current) {
      ref.current.focus();
    }
  }, [ref]);

  return (
    <FormControl variant="standard">
      <StyledInput
        id={id}
      value={value?value:''}
      multiline
      rows={rows}
      placeholder={placeholder}
      fullWidth
      required={required}
      onChange={(e)=>onChange(e.target.value)}
      onBlur={handleBlur}
      onFocus={handleFocus}
      disabled={isDisabled}
        inputRef={ref}
      />
    </FormControl>
  );
}
