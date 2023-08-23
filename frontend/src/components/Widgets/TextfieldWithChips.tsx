import React from "react";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import { Autocomplete, styled } from "@mui/material";
import Chip from "@mui/material/Chip";
import ClearOutlinedIcon from "@mui/icons-material/ClearOutlined";
import { vars } from "../../theme/variables";

const { buttonOutlinedColor, grey400, buttonOutlinedBorderColor } = vars;

const StyledInput = styled(TextField)(({ theme }) => ({

  "& .MuiInputBase-root": {
    boxShadow: 'none',
    borderRadius: 0,
    borderRight: 0,
    borderLeft:0,

    "& .MuiOutlinedInput-notchedOutline": {
      border: 0,
    },
    "& .Mui-focused, &:focus-visible": {
      border: '0 !important',
      boxShadow: 'none',
      borderShadow: 'none',
    },

  },

}));


const TextfieldWithChips = ({
  placeholder,
  options: { data, removeChip, disabled, onAutocompleteChange },
}: any) => {

  const handleDelete = (id: number) => {
    removeChip(id);
  };

  const handleOpenExternalLink = (uri: string) => () => {
    const url = uri.includes("://") ? uri : `https://${uri}`
    window.open(url, '_blank')
  }

  return (
    <FormControl variant="standard">
      <Autocomplete
        multiple
        disableClearable
        disabled={disabled}
        options={[]}
        onChange={(e, value) => onAutocompleteChange(e, value)}
        freeSolo
        autoComplete={false}
        defaultValue={[{}]}
        renderTags={(value: any, getTagProps) =>
          data.map((ele: { id: number; label: string, enableClick: boolean }, index: number) => (
            <Chip
              {...getTagProps({ index })}
              deleteIcon={<ClearOutlinedIcon />}
              variant="outlined"
              label={ele.label}
              key={ele.id}
              onClick={ele.enableClick ? handleOpenExternalLink(ele.label) : undefined}
              onDelete={() => handleDelete(ele.id)}
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
          ))
        }
        renderInput={(params) => (
          <StyledInput
            {...params}
            disabled={disabled}
            placeholder={placeholder}
          />
        )}
      />
    </FormControl>
  );
};

export default TextfieldWithChips;
