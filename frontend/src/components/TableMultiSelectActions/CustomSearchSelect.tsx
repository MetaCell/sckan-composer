import TextField from "@mui/material/TextField"
import InputAdornment from "@mui/material/InputAdornment"
import SearchIcon from "@mui/icons-material/Search"
import List from "@mui/material/List"
import ListItem from "@mui/material/ListItem"
import ListItemText from "@mui/material/ListItemText"
import Button from "@mui/material/Button"
import Box from "@mui/material/Box"
import Paper from "@mui/material/Paper"
import Popover from "@mui/material/Popover"
import {ListItemVariant} from "./ListItemVariant";
import {vars} from "../../theme/variables";

const styles = {
  paper: {
    width: "16.375rem",
    boxShadow: "0px 12px 16px -4px rgba(16, 24, 40, 0.08), 0px 4px 6px -2px rgba(16, 24, 40, 0.03)",
    borderRadius: ".5rem",
  },
  textField: {
    "& .MuiInputBase-root": {
      border: "0",
      boxShadow: "none",
      borderBottom: `1px solid ${vars.gray200}`,
      borderRadius: "0",
      
      "&.Mui-focused": {
        boxShadow: "none",
        border: "0 !important",
        borderBottom: `1px solid ${vars.gray200} !important`,
        
        "& .MuiOutlinedInput-notchedOutline": {
          border: "0 !important",
          boxShadow: "none",
        },
      },
      
      "& .MuiOutlinedInput-notchedOutline": {
        border: "0 !important",
        boxShadow: "none",
      },
    },
  },
  list: {
    mb: 2,
    maxHeight: 300,
    overflow: "auto",
    padding: "0.125rem 0.375rem"
  },
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
  footer: {
    display: "flex",
    gap: 1,
    padding: "0.5rem 0.75rem",
    borderTop: "1px solid #EAECF0",
    justifyContent: "center",
  }
}

export interface CustomSearchSelectProps<T> {
  open: boolean
  handleClose: () => void
  anchorEl: HTMLElement | null
  searchTerm: string
  setSearchTerm: (searchTerm: string) => void
  data: T[]
  getOptionLabel: (option: T) => string
  selectedOptions: T[]
  onOptionSelect: (option: T) => void
  placeholder?: string
  noOptionsText?: string
  cancelButtonText?: string
  confirmButtonText?: string
  onCancel?: () => void
  onConfirm?: (selectedOptions: T[]) => void
  variant?: "default" | "checkbox"
}

function CustomSearchSelect<T>({
     open,
     handleClose,
     anchorEl,
     searchTerm,
     setSearchTerm,
     data,
     getOptionLabel,
     selectedOptions,
     onOptionSelect,
     placeholder = "Search",
     noOptionsText = "No options",
     cancelButtonText = "Cancel",
     confirmButtonText = "Confirm",
     onCancel,
     onConfirm,
     variant = "default",
   }: CustomSearchSelectProps<T>) {
  const filteredOptions = data.filter((option) =>
    getOptionLabel(option).toLowerCase().includes(searchTerm.toLowerCase()),
  )
  
  const isOptionSelected = (option: T) =>
    selectedOptions.some((selectedOption) => getOptionLabel(selectedOption) === getOptionLabel(option))
  
  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={handleClose}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "left",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "left",
      }}
      sx={{ mt: 1 }}
    >
      <Paper sx={styles.paper}>
        <TextField
          fullWidth
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          variant="outlined"
          sx={styles.textField}
        />
        
        <List sx={styles.list}>
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option: T, index: number) => (
              <ListItemVariant
                key={index}
                option={option}
                index={index}
                isSelected={isOptionSelected(option)}
                getOptionLabel={getOptionLabel}
                onOptionSelect={onOptionSelect}
                variant={variant}
              />
            ))
          ) : (
            <ListItem>
              <ListItemText
                primary={noOptionsText}
                primaryTypographyProps={{
                  sx: { color: vars.gray50 },
                }}
              />
            </ListItem>
          )}
        </List>
        
        <Box sx={styles.footer}>
          <Button variant="outlined" onClick={onCancel} fullWidth>
            {cancelButtonText}
          </Button>
          <Button variant="contained" fullWidth>
            {confirmButtonText}
          </Button>
        </Box>
      </Paper>
    </Popover>
  )
}

export default CustomSearchSelect

