import * as React from "react";
import OutlinedInput from "@mui/material/OutlinedInput";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import Typography from "@mui/material/Typography";
import { vars } from "../../theme/variables";
import {ChangeRequestStatus} from "../../helpers/settings";

const CustomSingleSelect = ({
  onChange,
  placeholder,
  value,
  id,
  options: {
    label,
    data,
    enumOptions,
    isPathBuilderComponent = false,
    InputIcon,
    onUpdate,
    isDisabled,
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
  const isReadOnlyValue = selectOptions.find(({ value: id }: any) => id === value)?.label
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
      {
        isDisabled ? <Typography>{value ? isReadOnlyValue : '-'}</Typography> :
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
                  style={{ marginRight: ".5rem", width: "2rem" }}
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
            value={value !== null ? value : ""}
            onChange={async (event)  => {
              if (onUpdate) {
                try {
                  const result = await onUpdate(event.target.value, id);
                  if (result !== ChangeRequestStatus.CANCELLED) {
                    onChange(event.target.value);
                  }
                } catch (e) {
                  console.log(e)
                }
              } else {
                onChange(event.target.value);
              }
            }}
            disabled={isDisabled}
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
      }
    </>
  );
};

export default CustomSingleSelect;
