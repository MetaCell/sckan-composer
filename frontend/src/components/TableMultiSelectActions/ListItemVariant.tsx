import { ListItem, ListItemText, ListItemIcon, Checkbox } from "@mui/material"
import CheckIcon from "@mui/icons-material/Check"
import RemoveIcon from "@mui/icons-material/Remove"
import { vars } from "../../theme/variables"

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
interface ListItemVariantProps<T> {
  option: T
  index: number
  isSelected: boolean
  getOptionLabel: (option: T) => string
  onOptionSelect: (option: T) => void
  variant: "default" | "checkbox"
}

export function ListItemVariant<T>({
     option,
     index,
     isSelected,
     getOptionLabel,
     onOptionSelect,
     variant,
   }: ListItemVariantProps<T>) {
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
          primary={getOptionLabel(option)}
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
    }}>
      {
        isSelected ? <Checkbox checked /> : <RemoveIcon sx={{ color: vars.colorPrimary }} />
      }
      <ListItemText
        primary={getOptionLabel(option)}
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

