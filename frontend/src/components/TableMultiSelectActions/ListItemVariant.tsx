import { ListItem, ListItemText, ListItemIcon, Checkbox } from "@mui/material"
import CheckIcon from "@mui/icons-material/Check"
import { vars } from "../../theme/variables"
import {CheckedItemIcon, IndeterminateIcon, UncheckedItemIcon} from "../icons";
import React from "react";

const styles = {
  listItem: {
    cursor: "pointer",
    borderRadius: "0.375rem",
    border: `1px solid ${vars.whiteColor}`,
    padding: "0.625rem 0.625rem 0.625rem 0.5rem",
    
    "&:hover": {
      border: `1px solid ${vars.gray50}`,
      background: vars.gray50,
    },
    
    '& .MuiTypography-root': {
      color: vars.darkTextColor,
      fontWeight: 500,
    }
  },
}

export const StyledCheckBox = (props: any) => {
  return (
    <Checkbox
      {...props}
      sx={{ padding: 0 }}
      checkedIcon={<CheckedItemIcon sx={{ fontSize: 16 }} />}
      icon={<UncheckedItemIcon sx={{ fontSize: 16 }} />}
      indeterminateIcon={<IndeterminateIcon sx={{ fontSize: 16 }} />}
    />
  );
};
interface ListItemVariantProps<T> {
  option: any;
  index: number
  isSelected: boolean
  onOptionSelect: (option: T) => void
  variant: "default" | "checkbox",
  optionsInAllRows?: string[],
  optionsInSomeRows?: string[]
  selectedOptions?: string[]
}

export function ListItemVariant<T>({
     option,
     index,
     isSelected,
     onOptionSelect,
     variant,
     optionsInAllRows,
     optionsInSomeRows,
     selectedOptions
   }: ListItemVariantProps<T>) {
  console.log(   optionsInAllRows,
    optionsInSomeRows, selectedOptions)
  if (variant === "default") {
    return (
      <ListItem
        key={index}
        onClick={() => onOptionSelect(option)}
        sx={{
          ...styles.listItem,
          backgroundColor: isSelected ? vars.gray50 : "transparent",
        }}
      >
        <ListItemText
          sx={{ margin: 0 }}
          primary={option.label}
          primaryTypographyProps={{
            sx: { color: vars.darkTextColor, fontWeight: 500 },
          }}
        />
        {isSelected && (
          <ListItemIcon sx={{ minWidth: "auto" }}>
            <CheckIcon sx={{ color: vars.colorPrimary }} fontSize="small" />
          </ListItemIcon>
        )}
      </ListItem>
    )
  }

  return (
    <ListItem key={index} onClick={() => onOptionSelect(option)} sx={{
      ...styles.listItem,
      backgroundColor: isSelected ? vars.gray50 : "transparent",
      gap: '.5rem'
    }}>
     <StyledCheckBox checked={selectedOptions?.includes(option.label) || optionsInAllRows?.includes(option.label)} indeterminate={selectedOptions?.includes(option.label) && optionsInSomeRows?.includes(option.label)} />
      <ListItemText
        primary={option.label}
        primaryTypographyProps={{
          sx: {
            color: vars.darkTextColor,
            fontWeight: isSelected ? 500 : 400,
            fontSize: "0.875rem",
          },
        }}
      />
    </ListItem>
  )
}

