import React, { useState } from "react";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import Popover from "@mui/material/Popover";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import { ListItemIcon } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import { vars } from "../../theme/variables";

const styles = {
  popoverPaper: {
    width: "16rem",
    boxShadow: "0px 12px 16px -4px rgba(16, 24, 40, 0.08), 0px 4px 6px -2px rgba(16, 24, 40, 0.03)",
    borderRadius: ".5rem",
    padding: ".25rem 0",
    border: `1px solid ${vars.gray200}`,
  },
  list: {
    maxHeight: "20rem",
    overflow: "auto",
    padding: "0.125rem 0.375rem",
  },
  listItem: {
    cursor: "pointer",
    borderRadius: "0.375rem",
    padding: "0.625rem 0.625rem 0.625rem 0.5rem",
    "&:hover": {
      background: vars.gray50,
    },
  },
};

interface PopoverMenuProps {
  icon: React.ElementType;
  tooltip: string;
  options: string[];
  selectedOption?: string | null;
  onSelect: (option: string) => void;
  actionButtonDisabled?: boolean
}

const PopoverMenu: React.FC<PopoverMenuProps> = ({ icon: IconComponent, tooltip, options, selectedOption, onSelect, actionButtonDisabled = false }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  return (
    <>
      <Tooltip arrow title={tooltip}>
        <span>
          <IconButton onClick={handleOpen} disabled={actionButtonDisabled}>
            <IconComponent />
          </IconButton>
        </span>
      </Tooltip>
      
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{ paper: { sx: styles.popoverPaper } }}
      >
        <List sx={styles.list}>
          {options.map((option, index) => (
            <ListItem key={index} onClick={() => onSelect(option)} sx={styles.listItem}>
              <ListItemText primary={option} />
              {selectedOption === option && (
                <ListItemIcon sx={{ minWidth: "auto" }}>
                  <CheckIcon sx={{ color: vars.colorPrimary }} fontSize="small" />
                </ListItemIcon>
              )}
            </ListItem>
          ))}
        </List>
      </Popover>
    </>
  );
};

export default PopoverMenu;
