import React from 'react';
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import {Box, Stack, styled} from "@mui/material";
import Chip from "@mui/material/Chip";
import ClearOutlinedIcon from '@mui/icons-material/ClearOutlined';
import {vars} from "../../theme/variables";
import InputLabel from "@mui/material/InputLabel";
import Typography from "@mui/material/Typography";

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

export const ChipsInput = ({onChange,placeholder, options: { data, removeChip, label, disabled = false }}: any) => {

  const handleDelete = (id: number) => {
    removeChip(id)
  }

  return (
    <FormControl variant="standard">
      {
        label &&
        <InputLabel shrink htmlFor="custom-input">
          <Typography variant="h5" fontWeight={500}>{label}</Typography>
        </InputLabel>
      }

      <StyledInput
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        id='custom-input'
        placeholder={placeholder}
        InputProps={{
          startAdornment: (
            <Stack direction='row'>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap'
              }}>
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
              </div>

            </Stack>
          ),
        }}
      />
    </FormControl>

  );
}
