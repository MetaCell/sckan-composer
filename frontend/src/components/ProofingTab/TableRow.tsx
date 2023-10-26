import React from "react";
import { IconButton, TableRow as MuiTableRow, TableCell } from "@mui/material";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";


const TableRow = (props: any) => {
  const { action = true } = props;
  //const theme = useTheme();
  const rowStyles = {
    m: "0 !important",
    backgroundColor:'common.white',
    border: '1px solid #EAECF0',
  }


  return (
    <MuiTableRow sx={rowStyles}>
      <TableCell sx={{ borderBottom:0, borderTopLeftRadius:'8px', borderBottomLeftRadius:'8px'  }}>
       {props.startIcon}
      </TableCell>
      <TableCell width="100%" sx={{
        borderBottom: 0
      }}>{props.children}</TableCell>
      {action && (
        <TableCell sx={{ borderBottom:0, borderTopRightRadius:'8px', borderBottomRightRadius:'8px'  }}>
        <IconButton
          size="small"
          sx={{ visibility: "hidden" }}
        >
          <DeleteOutlineOutlinedIcon fontSize="small" />
        </IconButton>
      </TableCell>
      )}

    </MuiTableRow>
  );
};

export default TableRow;
