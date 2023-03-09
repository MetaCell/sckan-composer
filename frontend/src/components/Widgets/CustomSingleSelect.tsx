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

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};


const CustomSingleSelect = ( {onChange, placeholder, options: { label, data }} : any) => {

  return (
    <FormControl variant="standard">
      <InputLabel shrink htmlFor="custom-select" id="custom-select-label">
        <Typography variant="h5" fontWeight={500}>{label}</Typography>
      </InputLabel>
      <StyledSelect
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        id="custom-select"
        input={<OutlinedInput placeholder={placeholder} id="select-multiple-chip" />}
      >
        {data?.map(({label, id}: any) => (
          <MenuItem
            key={id}
            value={id}
          >
            {label}
          </MenuItem>
        ))}
      </StyledSelect>
    </FormControl>
  );
}

export default CustomSingleSelect
