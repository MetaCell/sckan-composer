import * as React from 'react';
import { Theme, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select  from '@mui/material/Select';
import Chip from '@mui/material/Chip';
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


const CustomMultipleSelectChip = ({onChange, options: { label, data }} : any) => {

  return (
    <FormControl variant="standard">
      <InputLabel shrink htmlFor="custom-select" id="custom-select-label">
        <Typography variant="h5" fontWeight={500}>{label}</Typography>
      </InputLabel>
      <StyledSelect
        onChange={(event) => onChange(event.target.value)}
        id="custom-select"
        multiple
        value={[]}
        input={<OutlinedInput id="select-multiple-chip" />}
        renderValue={(selected: any) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {selected.map((value: any) => (
              <Chip key={value} label={value} />
            ))}
          </Box>
        )}
        MenuProps={MenuProps}
      >
        <MenuItem disabled selected>
          Select an option
        </MenuItem>
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

export default CustomMultipleSelectChip
