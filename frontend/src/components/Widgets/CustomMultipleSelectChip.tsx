import * as React from 'react';
import { Theme, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Chip from '@mui/material/Chip';
import Typography from "@mui/material/Typography";
import {Input, styled} from "@mui/material";
import TextField from "@mui/material/TextField";


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

const names = [
  'Oliver Hansen',
  'Van Henry',
  'April Tucker',
  'Ralph Hubbard',
  'Omar Alexander',
  'Carlos Abbott',
  'Miriam Wagner',
  'Bradley Wilkerson',
  'Virginia Andrews',
  'Kelly Snyder',
];

function getStyles(name: string, personName: readonly string[], theme: Theme) {
  return {
    fontWeight:
      personName.indexOf(name) === -1
        ? theme.typography.fontWeightRegular
        : theme.typography.fontWeightMedium,
  };
}

const CustomMultipleSelectChip = ({options: { label }} : any) => {
  const theme = useTheme();
  const [personName, setPersonName] = React.useState<string[]>([]);

  const handleSelectChange = (e: any) => {
    setPersonName(e.target.value)
  };

  return (
    <FormControl variant="standard">
      <InputLabel shrink htmlFor="custom-select" id="custom-select-label">
        <Typography variant="h5" fontWeight={500}>{label}</Typography>
      </InputLabel>
      <StyledSelect
        id="custom-select"
        multiple
        value={personName}
        onChange={handleSelectChange}
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
        {names.map((name) => (
          <MenuItem
            key={name}
            value={name}
            style={getStyles(name, personName, theme)}
          >
            {name}
          </MenuItem>
        ))}
      </StyledSelect>
    </FormControl>
  );
}

export default CustomMultipleSelectChip
