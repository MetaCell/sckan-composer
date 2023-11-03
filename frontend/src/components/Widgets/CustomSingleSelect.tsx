import * as React from "react";
import OutlinedInput from "@mui/material/OutlinedInput";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import Typography from "@mui/material/Typography";
import { styled } from "@mui/material";
import { vars } from "../../theme/variables";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import { DestinationIcon } from "../icons";

const CustomSingleSelect = ({
  onChange,
  placeholder,
  disabled,
  value,
  options: {
    label,
    data,
    enumOptions,
    isPathBuilderComponent = false,
    InputIcon,
  },
}: any) => {
  const selectOptions = enumOptions ? enumOptions : data;

  const pathBuilderComponentStyle = isPathBuilderComponent
    ? {
        "& .MuiInputBase-root": {
          border: 0,
          boxShadow: "none",

          "&:hover": {
            border: 0,
            boxShadow: "none",
          },
        },
        "&:focus-within": {
          "& .MuiOutlinedInput-notchedOutline": {
            border: "none !important",
            boxShadow: "none !important",
          },
        },

        "& .MuiOutlinedInput-notchedOutline": {
          border: "none !important",
          boxShadow: "none !important",
        },

        "& .MuiSelect-select": {
          background: "transparent !important",
        },
      }
    : null;
  console.log(selectOptions);
  return (
    <>
      {label && (
        <Typography
          variant="h6"
          fontWeight={500}
          color={vars.titleFontColor}
          marginBottom={2}
        >
          {label}
        </Typography>
      )}
      <FormControl
        variant="standard"
        sx={{
          width: "auto",
          "& .MuiInputLabel-root": {
            color: "#667085",
            fontWeight: "400",
            fontSize: "14px",
            marginLeft: "14px",
          },
          ...pathBuilderComponentStyle,
        }}
      >
        <InputLabel shrink={false} htmlFor="custom-select">
          {!value && placeholder}
        </InputLabel>
        <Select
          startAdornment={
            isPathBuilderComponent ? (
              <InputIcon
                fill="#475467"
                style={{ marginRight: ".5rem", width: "1rem" }}
              />
            ) : null
          }
          sx={{
            "&:hover": {
              border: "1px solid #EAECF0",
              boxShadow: "0px 1px 2px rgba(16, 24, 40, 0.05)",
            },

            "& .MuiOutlinedInput-notchedOutline": {
              border: "none",
              boxShadow: "none",
            },
          }}
          value={value ? value : selectOptions[0]?.value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          id="custom-select"
          input={<OutlinedInput id="custom-select-input" />}
        >
          {selectOptions?.map(({ label: optionLabel, value: id }: any) => (
            <MenuItem key={id} value={id}>
              {optionLabel}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </>
  );
};

export default CustomSingleSelect;
