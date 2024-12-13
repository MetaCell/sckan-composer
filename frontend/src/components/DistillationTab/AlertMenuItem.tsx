import React, { useState } from "react";
import { MenuItem, Typography, Button, Box } from "@mui/material";
import {ArrowOutward, CheckRounded} from "@mui/icons-material";
import RemoveIcon from "@mui/icons-material/Remove";
import AddIcon from "@mui/icons-material/Add";
import { vars } from "../../theme/variables";
import IconButton from "@mui/material/IconButton";

interface AlertMenuItemProps {
  type: any;
  isSelected: boolean;
  isDisabled: boolean;
  onAdd?: (typeId: number) => void;
  onGoTo?: (typeId: number) => void;
  hideAlert?: (typeId: number) => void;
  alertStatus: string;
}

const styles = {
  menuItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: ".5rem",
    padding: "0.625rem 0.625rem 0.625rem 0.5rem",
    "&:hover": {
      backgroundColor: "transparent",
      "& .add-button": {
        opacity: 1,
        visibility: "visible",
      },
    },
  },
  alertName: {
    display: "-webkit-box",
    WebkitLineClamp: "2",
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "normal",
    wordBreak: "break-word",
    color: vars.darkTextColor,
    fontWeight: 500,
    fontSize: "1rem",
  },
  btnStyle: {
    color: vars.darkBlue,
    backgroundColor: vars.lightBlue,
    padding: "0.5rem 0.875rem",
    opacity: 0,
    visibility: "hidden",
    
    "& .MuiButton-startIcon, .MuiButton-endIcon": {
      "& .MuiSvgIcon-root": {
        color: vars.darkBlue,
        visibility: "visible",
      },
    },
    
    "&:hover": {
      backgroundColor: vars.badgeBg,
      color: vars.primary800,
      boxShadow: "none",
      "& .MuiButton-startIcon, .MuiButton-endIcon": {
        "& .MuiSvgIcon-root": {
          color: vars.primary800,
          visibility: "visible",
        },
      },
    },
  },
};

const AlertMenuItem: React.FC<AlertMenuItemProps> = ({
                                                       type,
                                                       isSelected,
                                                       onAdd,
                                                       hideAlert, // New callback
                                                       alertStatus,
                                                       onGoTo,
                                                     }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const handleHide= () => {
    if (hideAlert) {
      hideAlert(type.id);
    }
  };
  
  const handleGoTo = () => {
    if (onGoTo) {
      onGoTo(type.id);
    }
  };
  
  const handleAdd = () => {
    if (onAdd) {
      onAdd(type.id);
    }
  };
  
  return (
    <MenuItem
      key={type.id}
      value={type.id}
      sx={{
        ...styles.menuItem,
        cursor: alertStatus === "displayed" ? "default" : "pointer",
        "& .MuiSvgIcon-root": {
          color: vars.colorPrimary,
          visibility: alertStatus === "displayed" ? "visible" : "hidden",
        },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: ".5rem", flex: 1 }}>
        <IconButton
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={handleHide} sx={{
          p: 0,
          '&:hover': {
            backgroundColor: "transparent",
          },
          '& .MuiSvgIcon-root': {
            fontSize: '1.25rem',
            width: '1.25rem',
            height: '1.25rem',
          }
        }}>
          {isHovered && isSelected ? <RemoveIcon /> :  <CheckRounded />}
        </IconButton>
        <Typography sx={styles.alertName}>{type.name}</Typography>
      </Box>
      
      {!isSelected && alertStatus !== "displayed" ? (
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          size="small"
          onClick={handleAdd}
          className="add-button"
          sx={styles.btnStyle}
        >
          Add
        </Button>
      ) : (
        <Button
          variant="contained"
          endIcon={<ArrowOutward />}
          size="small"
          onClick={handleGoTo}
          className="add-button"
          sx={styles.btnStyle}
        >
          Go to
        </Button>
      )}
    </MenuItem>
  );
};

export default AlertMenuItem;
