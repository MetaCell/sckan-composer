import * as React from "react";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import {Box, Stack, styled} from "@mui/material";
import Chip from "@mui/material/Chip";
import ClearOutlinedIcon from '@mui/icons-material/ClearOutlined';
import {vars} from "../../theme/variables";

const {
  buttonOutlinedColor, grey400, buttonOutlinedBorderColor
} = vars

const StyledInput = styled(TextField)(({ theme }) => ({
  'label + &': {
    marginTop: theme.spacing(4),
  },
  '& .MuiOutlinedInput-notchedOutline': {
    border: 0
  },
}));

export const ChipsInput = ({onChange,placeholder, options: { data, removeChip, extraData }}: any) => {
  const handleDelete = (id: number) => {
    removeChip(id)
  }

  return (
    <FormControl variant="standard">
      <StyledInput
        onChange={(event) => onChange(event.target.value)}
        id='custom-input'
        placeholder={placeholder}
        InputProps={{
          startAdornment: (
            <Stack direction='row' flexWrap='wrap'>
              {data?.map(({ id, label }: any) => {
                return (
                  <Chip
                    deleteIcon={<ClearOutlinedIcon />}
                    variant="outlined"
                    label={label}
                    key={id}
                    onDelete={() => handleDelete(id)}
                    sx={{
                      border: `1px solid ${buttonOutlinedBorderColor}`,
                      borderRadius: '6px',
                      margin: '4px',

                      "& .MuiChip-label": {
                        color: buttonOutlinedColor,
                        fontSize: '14px'
                      },
                      "& .MuiChip-deleteIcon": {
                        color: grey400,
                        fontSize: '14px'
                      }
                    }}
                  />
                );
              })}
            </Stack>
          ),
        }}
      />
    </FormControl>

  );
}
