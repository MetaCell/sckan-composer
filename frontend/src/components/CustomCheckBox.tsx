import React from "react";

import Checkbox, { CheckboxProps } from '@mui/material/Checkbox';
import { styled } from "@mui/material/styles";
import {vars} from "../theme/variables";

const {
  colorPrimary,
  lightBlue,
  radioBorderColor
} = vars;

const BpIcon = styled('span')(() => ({
  borderRadius: 6,
  width: 20,
  height: 20,
  boxShadow:`inset 0 0 0 0.0625rem ${radioBorderColor}, inset 0 -1px 0 ${radioBorderColor}`,
  
  'input:hover ~ &': {
    backgroundColor: lightBlue,
    boxShadow:`inset 0 0 0 0.0625rem ${colorPrimary}, inset 0 -0.0625rem 0 ${colorPrimary}`,
  },
  
  '.Mui-focusVisible &': {
    outline: `0.125rem auto ${lightBlue}`,
    outlineOffset: 2,
  },
  '.Mui-checked &': {
    boxShadow:`inset 0 0 0 0.0625rem ${colorPrimary}, inset 0 -0.0625rem 0 ${colorPrimary}`,
  },
  
  'input:disabled ~ &': {
    boxShadow: 'none',
    background: colorPrimary,
  },
}));

const BpCheckedIcon = styled(BpIcon)({
  backgroundColor: lightBlue,
  '&:before': {
    display: 'block',
    width: 16,
    height: 16,
    marginTop: '10%',
    marginRight: 'auto',
    marginLeft: 'auto',
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M10 3L4.5 8.5L2 6' stroke='%233779E1' stroke-width='1.6666' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
    content: '""',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
  },
  'input:hover ~ &': {
    backgroundColor: lightBlue,
  },
});

function BpCheckbox(props: CheckboxProps) {
  return (
    <Checkbox
      sx={{
        '&:hover': { bgcolor: 'transparent' },
      }}
      disableRipple
      color="default"
      checkedIcon={<BpCheckedIcon />}
      icon={<BpIcon />}
      inputProps={{ 'aria-label': 'Checkbox demo' }}
      {...props}
    />
  );
}

const CheckBoxWidget = ({ checked = false, onChange }: { checked?: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => {
  return (
    <BpCheckbox checked={checked} onChange={onChange}/>
  );
};

export default CheckBoxWidget;