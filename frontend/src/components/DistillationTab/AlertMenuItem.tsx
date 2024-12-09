import React from "react";
import { MenuItem, Typography, Button, Box } from "@mui/material";
import { CheckRounded } from "@mui/icons-material";
import AddIcon from "@mui/icons-material/Add";
import { vars } from "../../theme/variables";

interface AlertMenuItemProps {
  type: any;
  isSelected: boolean;
  isDisabled: boolean;
  onAdd: (typeId: number) => void;
  alertStatus: string;
}

const AlertMenuItem: React.FC<AlertMenuItemProps> = ({ type, isSelected, isDisabled, onAdd, alertStatus }) => {
  return (
    <MenuItem
      key={type.id}
      value={type.id}
      sx={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: ".5rem",
        padding: "0.625rem 0.625rem 0.625rem 0.5rem",
        cursor: alertStatus === 'displayed' ? "default" : "pointer",
        "&:hover": {
          backgroundColor: "transparent",
          "& .add-button": {
            opacity: 1,
            visibility: "visible",
          },
        },
        
        '& .MuiSvgIcon-root': {
          color: vars.colorPrimary,
          visibility: alertStatus === 'displayed' ? "visible" : "hidden",
        }
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: '.5rem', flex: 1 }}>
        <CheckRounded />
        <Typography
          sx={{
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
          }}
        >
          {type.name}
        </Typography>
      </Box>
     
      {!isSelected && alertStatus !== 'displayed' && (
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          size="small"
          onClick={() => onAdd(type.id)}
          disabled={isDisabled}
          className="add-button"
          sx={{
            color: vars.darkBlue,
            backgroundColor: vars.lightBlue,
            padding: '0.5rem 0.875rem',
            opacity: 0,
            visibility: "hidden",
            
            '& .MuiButton-startIcon': {
              '& .MuiSvgIcon-root': {
                color: vars.darkBlue,
                visibility: 'visible'
              }
            },
            
            '&:hover': {
              backgroundColor: vars.badgeBg,
              color: vars.primary800,
              boxShadow: 'none',
              '& .MuiButton-startIcon': {
                '& .MuiSvgIcon-root': {
                  color: vars.primary800,
                  visibility: 'visible'
                }
              }
            }
          }}
        >
          Add
        </Button>
      )}
    </MenuItem>
  );
};

export default AlertMenuItem;
