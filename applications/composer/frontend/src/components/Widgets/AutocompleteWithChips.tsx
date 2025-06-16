import React, { useState } from "react";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import { Autocomplete, styled } from "@mui/material";
import Chip from "@mui/material/Chip";
import ClearOutlinedIcon from "@mui/icons-material/ClearOutlined";
import { vars } from "../../theme/variables";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import Box from "@mui/material/Box";

const { buttonOutlinedColor, grey400, buttonOutlinedBorderColor, titleFontColor } = vars;

const StyledInput = styled(TextField)(({ theme }) => ({
  "label + &": {
    marginTop: theme.spacing(4),
  },
  "& .MuiOutlinedInput-notchedOutline": {
    border: 0,
  },
}));

const CustomChip = ({ id, label, onDelete, isDisabled }: any) => {
  return (
    <Chip
      deleteIcon={<ClearOutlinedIcon />}
      variant="outlined"
      label={label}
      key={id}
      onDelete={!isDisabled ? (e) => {
        e.stopPropagation();
        onDelete(id)
      } : undefined}
      sx={{
        border: `1px solid ${buttonOutlinedBorderColor}`,
        borderRadius: "6px",
        margin: "4px",
        "& .MuiChip-label": {
          color: buttonOutlinedColor,
          fontSize: "14px",
        },
        "& .MuiChip-deleteIcon": {
          color: grey400,
          fontSize: "14px",
        },
      }}
    />
  );
};

export const AutocompleteWithChips = ({
  placeholder,
  options: {
    data,
    removeChip,
    label,
    isDisabled,
    options,
    onAutocompleteChange,
  },
}: any) => {

  const [isInputFocused, setInputFocus] = useState(false);

  const handleDelete = (id: number) => {
    removeChip(id);
  };

  const handleDeleteAll = () => {
    data.forEach((ele: { id: number, label: string }) => {
      handleDelete(ele.id);
    });
  };
  return (
    <FormControl variant="standard">
      <Typography
        variant="h6"
        fontWeight={500}
        marginBottom={2}
        color={titleFontColor}
      >
        {label}
      </Typography>
      {isDisabled ? (
        <Box>
          {data.length === 0 ? '-' : data.map((ele: { id: number; label: string }, index: number) => (
            <CustomChip
              id={ele.id}
              label={ele.label}
              isDisabled={isDisabled}
            />
          ))}
        </Box>
      ) : (
        <Autocomplete
          multiple
          disableClearable
          disabled={isDisabled}
          options={options}
          onChange={(e, value) => onAutocompleteChange(e, value)}
          // freeSolo
          defaultValue={options?.length > 0 ? [options[0].label] : [{}]}
          // getOptionDisabled={(option) => {
          //   return data.some((ele: { id: number, label: string, value: number }) => ele?.value === option.value);
          // }}
          ListboxProps={{
            sx: {
              '& .MuiAutocomplete-option[aria-disabled="true"]': {
                opacity: 1,
                color: vars.gray600,
                cursor: 'not-allowed',
              }
            }
          }}
          renderTags={(value: any, getTagProps) =>
            data?.map((ele: { id: number; label: string }, index: number) => (
              <CustomChip
                id={ele.id}
                label={ele.label}
                onDelete={handleDelete}
                isDisabled={isDisabled}
              />
            ))
          }
          renderInput={(params) => (
            <StyledInput
              {...params}
              disabled={isDisabled}
              id="custom-input"
              placeholder={placeholder}
              onFocus={() => setInputFocus(true)}
              onBlur={() => setInputFocus(false)}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {isInputFocused ? (
                      <CloseIcon
                        color="action"
                        fontSize="small"
                        sx={{ cursor: "pointer", mr: 0.6 }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleDeleteAll();
                        }}
                      />
                    ) : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />
      )}
    </FormControl>
  );
};
