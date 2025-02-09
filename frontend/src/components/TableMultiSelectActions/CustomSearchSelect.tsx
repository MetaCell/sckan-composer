import TextField from "@mui/material/TextField"
import InputAdornment from "@mui/material/InputAdornment"
import SearchIcon from "@mui/icons-material/Search"
import List from "@mui/material/List"
import ListItem from "@mui/material/ListItem"
import ListItemText from "@mui/material/ListItemText"
import Button from "@mui/material/Button"
import Box from "@mui/material/Box"
import Popover from "@mui/material/Popover"
import {ListItemVariant} from "./ListItemVariant";
import {vars} from "../../theme/variables";
import {HelpOutlineRounded} from "@mui/icons-material";
import Tooltip from "@mui/material/Tooltip";
import React from "react";
import { OptionType } from "../../types"

const styles = {
  paper: {
    width: "16.375rem",
    boxShadow: "0px 12px 16px -4px rgba(16, 24, 40, 0.08), 0px 4px 6px -2px rgba(16, 24, 40, 0.03)",
    borderRadius: ".5rem",
    marginTop: 1,
    border: `1px solid ${vars.gray200}`
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
    maxHeight: '25rem',
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

export interface CustomSearchSelectProps {
  open: boolean
  handleClose: () => void
  anchorEl: HTMLElement | null
  searchTerm: string
  setSearchTerm: (searchTerm: string) => void
  data: OptionType[]
  selectedOptions: string[]
  onOptionSelect: (option: OptionType) => void
  placeholder?: string
  noOptionsText?: string
  cancelButtonText?: string
  confirmButtonText?: string
  onCancel?: () => void
  onConfirm?: () => void
  variant?: "default" | "checkbox",
  optionsInAllRows?: string[]
  optionsInSomeRows?: string[],
  showHelperText?: boolean,
  helperText?: string
}

const CustomSearchSelect = ({
     open,
     handleClose,
     anchorEl,
     searchTerm,
     setSearchTerm,
     data,
     selectedOptions,
     onOptionSelect,
     placeholder = "Search",
     noOptionsText = "No options",
     cancelButtonText = "Cancel",
     confirmButtonText = "Confirm",
     onCancel,
     onConfirm,
     variant = "default",
     optionsInAllRows,
     optionsInSomeRows,
     showHelperText = false,
     helperText
   }: CustomSearchSelectProps) => {
  
  const isOptionSelected = (option: OptionType) =>
    selectedOptions.some((selectedOption: string) => selectedOption === option.label);
  
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
      slotProps={{
        paper: {
          sx: styles.paper
        }
      }}
    >
      <TextField
        fullWidth
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize='small' sx={{color: vars.gray500}}  />
            </InputAdornment>
          ),
          endAdornment: showHelperText && (
            <InputAdornment position="end">
              <Tooltip title={ <span
                dangerouslySetInnerHTML={{
                  __html: helperText || ''
                }}
              />}>
                <HelpOutlineRounded fontSize='small' sx={{color: vars.gray400, cursor: 'pointer'}} />
              </Tooltip>
            </InputAdornment>
          ),
        }}
        variant="outlined"
        sx={styles.textField}
      />
      
      <List sx={styles.list}>
        {data.length > 0 ? (
          data.map((option: OptionType, index: number) => (
            <ListItemVariant
              key={index}
              option={option}
              index={index}
              isSelected={isOptionSelected(option)}
              onOptionSelect={onOptionSelect}
              variant={variant}
              optionsInAllRows={optionsInAllRows}
              optionsInSomeRows={optionsInSomeRows}
              selectedOptions={selectedOptions}
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
        <Button variant="contained" onClick={onConfirm} fullWidth>
          {confirmButtonText}
        </Button>
      </Box>
    </Popover>
  )
}

export default CustomSearchSelect

