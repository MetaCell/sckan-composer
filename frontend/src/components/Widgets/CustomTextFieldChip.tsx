import Chip from "@mui/material/Chip";
import ClearOutlinedIcon from "@mui/icons-material/ClearOutlined";
import React from "react";
import {vars} from "../../theme/variables";
const { buttonOutlinedColor, grey400, buttonOutlinedBorderColor } = vars;

const CustomTextFieldChip = ({ id, label, onDelete, onClick, isDisabled }: any) => {
  return (
    <Chip
      deleteIcon={<ClearOutlinedIcon />}
      variant="outlined"
      label={label}
      key={id}
      onClick={!isDisabled ? onClick : undefined}
      onDelete={!isDisabled ? (e) => {
        e.stopPropagation();
        onDelete(id)
      } : undefined}
      sx={{
        border: `1px solid ${buttonOutlinedBorderColor}`,
        borderRadius: "6px",
        margin: "4px",
        "& .MuiChip-label": {
          color: buttonOutlinedColor,
          fontSize: "14px",
        },
        "& .MuiChip-deleteIcon": {
          color: grey400,
          fontSize: "14px",
        },
      }}
    />
  );
};

export default CustomTextFieldChip