import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Box } from "@mui/material";
import { IconButton, TableRow as MuiTableRow, TableCell } from "@mui/material";
import DragHandleIcon from "@mui/icons-material/DragHandle";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";

export function SortableItem(props: any) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: props.id });

  const { id, children, onDropIndexClick, disabled } = props;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginTop: "8px",
  };

  const rowStyles = (theme: any) => ({
    m: "0 !important",
    backgroundColor: "common.white",
  });

  return (
    <MuiTableRow sx={rowStyles} ref={setNodeRef} style={style}>
      <TableCell
        sx={{
          borderBottom: 0,
          borderTopLeftRadius: "8px",
          borderBottomLeftRadius: "8px",
        }}
      >
        <IconButton
          size="small"
          disabled={disabled}
          {...attributes}
          {...listeners}
          sx={{ p: 0 }}
        >
          <DragHandleIcon fontSize="small" />
        </IconButton>
      </TableCell>
      <TableCell
        className="inLineForm"
        width="100%"
        sx={{
          borderBottom: 0,
        }}
      >
        {children}
      </TableCell>
      <TableCell
        sx={{
          borderBottom: 0,
          borderTopRightRadius: "8px",
          borderBottomRightRadius: "8px",
        }}
      >
        <IconButton size="small" onClick={onDropIndexClick} disabled={disabled}>
          <DeleteOutlineOutlinedIcon fontSize="small" />
        </IconButton>
      </TableCell>
    </MuiTableRow>
  );
}