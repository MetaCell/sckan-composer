import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import { ChangeStatusIcon } from "../icons";
import Popover from "@mui/material/Popover";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import { vars } from "../../theme/variables";
import React, {useCallback, useState} from "react";
import { ListItemIcon } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import {ChangeRequestStatus} from "../../helpers/settings";

const styles = {
  paper: {
    width: "16.375rem",
    boxShadow: "0px 12px 16px -4px rgba(16, 24, 40, 0.08), 0px 4px 6px -2px rgba(16, 24, 40, 0.03)",
    borderRadius: ".5rem",
    padding: ".25rem 0",
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
    maxHeight: "25rem",
    overflow: "auto",
    padding: "0.125rem 0.375rem",
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
    
    "& .MuiTypography-root": {
      color: vars.darkTextColor,
      fontWeight: 500,
    },
  },
};

const ChangeStatus = ({selectedTableRows}: any) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  
  const statusOptions = Object.values(ChangeRequestStatus);
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleViewStatusMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleStatusSelect = (status: string) => {
    setSelectedStatus(status);
    handleClose();
  };
  
  const isUniformState = useCallback(() => {
    if (!Array.isArray(selectedTableRows) || selectedTableRows.length === 0) return false;
    const firstState = selectedTableRows[0]?.state;
    return selectedTableRows.every(item => item.state === firstState);
  }, [selectedTableRows]);

  return (
    <>
      <Tooltip
        arrow
        title={isUniformState() ? "Change status" : "Select statements with the same status to enable bulk change"}
        disableInteractive
      >
        <span>
          <IconButton onClick={handleViewStatusMenu} disabled={!isUniformState()}>
            <ChangeStatusIcon />
          </IconButton>
        </span>
      </Tooltip>

      
      <Popover
        open={Boolean(anchorEl)}
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
        <List sx={styles.list}>
          {statusOptions.length > 0 ? (
            statusOptions.map((status: string, index: number) => (
              <ListItem
                key={index}
                onClick={() => handleStatusSelect(status)}
                sx={{
                  ...styles.listItem,
                  backgroundColor: selectedStatus === status ? vars.gray50 : "transparent",
                }}
              >
                <ListItemText
                  sx={{ margin: 0 }}
                  primary={status}
                  primaryTypographyProps={{
                    sx: { color: vars.darkTextColor, fontWeight: 500 },
                  }}
                />
                {selectedStatus === status && (
                  <ListItemIcon sx={{ minWidth: "auto" }}>
                    <CheckIcon sx={{ color: vars.colorPrimary }} fontSize="small" />
                  </ListItemIcon>
                )}
              </ListItem>
            ))
          ) : (
            <ListItem>
              <ListItemText
                primary="No matching statuses"
                primaryTypographyProps={{
                  sx: { color: vars.gray50 },
                }}
              />
            </ListItem>
          )}
        </List>
      </Popover>
    </>
  );
};

export default ChangeStatus;
