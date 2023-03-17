import * as React from 'react';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select  from '@mui/material/Select';
import Typography from "@mui/material/Typography";
import {styled} from "@mui/material";
import { vars } from '../../theme/variables';


const StyledSelect = styled(Select)(({ theme }) => ({
  'label + &': {
    marginTop: theme.spacing(4),
  },

  "&:hover": {
    border: '1px solid #EAECF0',
    boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.05)',
  },

  "& .MuiOutlinedInput-notchedOutline": {
    border: 0,
    boxShadow: 'none',
  }
}));

const CustomSingleSelect = ( {onChange, placeholder,value, options: { label, data }} : any) => {
  return (
    <FormControl variant="standard">
        <Typography variant="h6" fontWeight={500} marginBottom={2} color={vars.titleFontColor}>
          {label}
        </Typography>
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
