import React from "react";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import { Autocomplete, styled } from "@mui/material";
import Box from "@mui/material/Box";
import CustomTextFieldChip from "./CustomTextFieldChip";

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
  options: { data, removeChip, isDisabled, onAutocompleteChange },
}: any) => {

  const handleDelete = (id: number) => {
    removeChip(id);
  };

  const handleOpenExternalLink = (uri: string) => () => {
    const url = uri.includes("://") ? uri : `https://${uri}`
    window.open(url, '_blank')
  }

  return (
    <>
      { isDisabled ? <Box>
        {
          data.map(
            (
              ele: { id: number; label: string; enableClick: boolean },
              index: number,
            ) => (
              <CustomTextFieldChip
                id={ele.id}
                label={ele.label}
                onClick={ele.enableClick ? handleOpenExternalLink(ele.label) : undefined}
                isDisabled={isDisabled}
              />
            ),
          )
        }
        </Box>
         :
        <FormControl variant="standard">
          <Autocomplete
            multiple
            disableClearable
            disabled={isDisabled}
            options={[]}
            onChange={(e, value) => onAutocompleteChange(e, value)}
            freeSolo
            autoComplete={false}
            defaultValue={[{}]}
            renderTags={(value: any, getTagProps) =>
              data.map(
                (
                  ele: { id: number; label: string; enableClick: boolean },
                  index: number,
                ) => (
                  <CustomTextFieldChip
                    {...getTagProps({ index })}
                    id={ele.id}
                    label={ele.label}
                    onClick={ele.enableClick ? handleOpenExternalLink(ele.label) : undefined}
                    onDelete={() => handleDelete(ele.id)}
                    isDisabled={isDisabled}
                  />
                ),
              )
            }
            renderInput={(params) => (
              <StyledInput
                {...params}
                disabled={isDisabled}
                placeholder={placeholder}
              />
            )}
          />
        </FormControl>
      }
    </>
  );
};

export default TextfieldWithChips;
