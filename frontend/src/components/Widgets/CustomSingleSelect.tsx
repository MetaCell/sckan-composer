import * as React from 'react';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select  from '@mui/material/Select';
import Typography from "@mui/material/Typography";
import {styled} from "@mui/material";


const StyledSelect = styled(Select)(({ theme }) => ({
  'label + &': {
    marginTop: theme.spacing(4),
  },
}));

const CustomSingleSelect = ( {onChange, placeholder,value, options: { label, data }} : any) => {
  return (
    <FormControl variant="standard">
      <InputLabel shrink htmlFor="custom-select" id="custom-select-label">
        <Typography variant="h5" fontWeight={500}>{label}</Typography>
      </InputLabel>
      <StyledSelect
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        id="custom-select"
        input={<OutlinedInput placeholder={placeholder} id="select-multiple-chip" />}
      >
        {data?.map(({label : optionLabel, id}: any) => (
          <MenuItem
            key={id}
            value={id}
          >
            {optionLabel}
          </MenuItem>
        ))}
      </StyledSelect>
    </FormControl>
  );
}

export default CustomSingleSelect
