import * as React from 'react';
import { styled } from '@mui/material/styles';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import { Tooltip } from '@mui/material';

const MaterialUISwitch = styled(Switch)(() => ({
  width: 44,
  height: 24,
  padding: 2,
  margin: '0 !important',
  '& .MuiSwitch-switchBase': {
    margin: 2.7,
    '&.Mui-checked': {
      '& .MuiSwitch-thumb:before': {
        backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="14" width="14" viewBox="0 0 14 14"><path fill="${encodeURIComponent(
          '#8300BF',
        )}" d="M10.5002 4.95833H9.91683V3.79167C9.91683 2.18167 8.61016 0.875 7.00016 0.875C5.39016 0.875 4.0835 2.18167 4.0835 3.79167V4.95833H3.50016C2.8585 4.95833 2.3335 5.48333 2.3335 6.125V11.9583C2.3335 12.6 2.8585 13.125 3.50016 13.125H10.5002C11.1418 13.125 11.6668 12.6 11.6668 11.9583V6.125C11.6668 5.48333 11.1418 4.95833 10.5002 4.95833ZM5.25016 3.79167C5.25016 2.82333 6.03183 2.04167 7.00016 2.04167C7.9685 2.04167 8.75016 2.82333 8.75016 3.79167V4.95833H5.25016V3.79167ZM10.5002 11.9583H3.50016V6.125H10.5002V11.9583ZM7.00016 10.2083C7.64183 10.2083 8.16683 9.68333 8.16683 9.04167C8.16683 8.4 7.64183 7.875 7.00016 7.875C6.3585 7.875 5.8335 8.4 5.8335 9.04167C5.8335 9.68333 6.3585 10.2083 7.00016 10.2083Z"/></svg>')`,
      },
      '& + .MuiSwitch-track': {
        opacity: 1,
        backgroundColor: '#8300BF',
      },
    },
    '&:hover': {
      '& .MuiSwitch-thumb:before': {
        backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="14" width="14" viewBox="0 0 14 14"><path fill="${encodeURIComponent(
          '#6C707A',
        )}" d="M10.5002 4.95833H9.91683V3.79167C9.91683 2.18167 8.61016 0.875 7.00016 0.875C5.39016 0.875 4.0835 2.18167 4.0835 3.79167V4.95833H3.50016C2.8585 4.95833 2.3335 5.48333 2.3335 6.125V11.9583C2.3335 12.6 2.8585 13.125 3.50016 13.125H10.5002C11.1418 13.125 11.6668 12.6 11.6668 11.9583V6.125C11.6668 5.48333 11.1418 4.95833 10.5002 4.95833ZM5.25016 3.79167C5.25016 2.82333 6.03183 2.04167 7.00016 2.04167C7.9685 2.04167 8.75016 2.82333 8.75016 3.79167V4.95833H5.25016V3.79167ZM10.5002 11.9583H3.50016V6.125H10.5002V11.9583ZM7.00016 10.2083C7.64183 10.2083 8.16683 9.68333 8.16683 9.04167C8.16683 8.4 7.64183 7.875 7.00016 7.875C6.3585 7.875 5.8335 8.4 5.8335 9.04167C5.8335 9.68333 6.3585 10.2083 7.00016 10.2083Z"/></svg>')`,
      },
      '&.Mui-checked': {
        '& .MuiSwitch-thumb:before': {
          backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="14" width="14" viewBox="0 0 14 14"><path fill="${encodeURIComponent(
            '#5E008A',
          )}" d="M10.5002 4.95833H9.91683V3.79167C9.91683 2.18167 8.61016 0.875 7.00016 0.875C5.39016 0.875 4.0835 2.18167 4.0835 3.79167V4.95833H3.50016C2.8585 4.95833 2.3335 5.48333 2.3335 6.125V11.9583C2.3335 12.6 2.8585 13.125 3.50016 13.125H10.5002C11.1418 13.125 11.6668 12.6 11.6668 11.9583V6.125C11.6668 5.48333 11.1418 4.95833 10.5002 4.95833ZM5.25016 3.79167C5.25016 2.82333 6.03183 2.04167 7.00016 2.04167C7.9685 2.04167 8.75016 2.82333 8.75016 3.79167V4.95833H5.25016V3.79167ZM10.5002 11.9583H3.50016V6.125H10.5002V11.9583ZM7.00016 10.2083C7.64183 10.2083 8.16683 9.68333 8.16683 9.04167C8.16683 8.4 7.64183 7.875 7.00016 7.875C6.3585 7.875 5.8335 8.4 5.8335 9.04167C5.8335 9.68333 6.3585 10.2083 7.00016 10.2083Z"/></svg>')`,
        },
        '& + .MuiSwitch-track': {
          opacity: 1,
          backgroundColor: '#5E008A',
        },
      },
    }
  },
  '& .MuiSwitch-thumb': {
    backgroundColor: '#fff',
    width: 18,
    height: 18,
    boxShadow: '0px 1px 3px 0px rgba(16, 24, 40, 0.10), 0px 1px 2px 0px rgba(16, 24, 40, 0.06)',
    '&::before': {
      content: "''",
      position: 'absolute',
      width: '100%',
      height: '100%',
      left: 0,
      top: 0,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="14" width="14" viewBox="0 0 14 14"><path fill="${encodeURIComponent(
        '#818898',
      )}" d="M10.5007 4.95833H9.91732V3.79167C9.91732 2.18167 8.61065 0.875 7.00065 0.875C5.39065 0.875 4.08398 2.18167 4.08398 3.79167H5.25065C5.25065 2.82333 6.03232 2.04167 7.00065 2.04167C7.96898 2.04167 8.75065 2.82333 8.75065 3.79167V4.95833H3.50065C2.85898 4.95833 2.33398 5.48333 2.33398 6.125V11.9583C2.33398 12.6 2.85898 13.125 3.50065 13.125H10.5007C11.1423 13.125 11.6673 12.6 11.6673 11.9583V6.125C11.6673 5.48333 11.1423 4.95833 10.5007 4.95833ZM10.5007 11.9583H3.50065V6.125H10.5007V11.9583ZM7.00065 10.2083C7.64232 10.2083 8.16732 9.68333 8.16732 9.04167C8.16732 8.4 7.64232 7.875 7.00065 7.875C6.35898 7.875 5.83398 8.4 5.83398 9.04167C5.83398 9.68333 6.35898 10.2083 7.00065 10.2083Z"/></svg>')`,
    },
  },
  '& .MuiSwitch-track': {
    opacity: 1,
    backgroundColor: '#EDEFF2',
    borderRadius: 20 / 2,
  },
}));

const CustomizedSwitches = ({locked, setLocked}: {locked: boolean, setLocked: (locked: boolean) => void})=> {
  return (
      <FormControlLabel
        control={
          <Tooltip arrow title={locked ? 'The diagram is locked and saved. You cannot change the positions of the entities' : 'The diagram is unlocked. You can move the population entities freely. Lock to persist.'}>
             <MaterialUISwitch sx={{ m: 1 }} checked={locked} onClick={() => setLocked(!locked)} />
          </Tooltip>
         }
        label=""
      />
  );
}

export default CustomizedSwitches