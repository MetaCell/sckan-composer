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
  options: { label, data, enumOptions },
}: any) => {
  const selectOptions = enumOptions ? enumOptions : data;
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
        }}
      >
        <InputLabel shrink={false} htmlFor="custom-select">
          {!value && placeholder}
        </InputLabel>
        <Select
          startAdornment={<DestinationIcon />}
          sx={{
            "&:hover": {
              border: 0,
              boxShadow: "none",
            },

            "& .MuiOutlinedInput-notchedOutline": {
              border: 0,
              boxShadow: "none",
            },

            "&.MuiInputBase-root": {
              border: 0,
              boxShadow: "none",
              width: "auto",
            },
          }}
          value={value ? value : ""}
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
