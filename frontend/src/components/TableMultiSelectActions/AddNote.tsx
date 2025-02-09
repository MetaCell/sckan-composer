import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import { NoteAddIcon } from "../icons";
import React, {useCallback, useState} from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import {vars} from "../../theme/variables";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

const styles = {
  dialogPaper: {
    width: "30rem",
  },
  dialogTitle: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    p: '1.5rem 1.5rem .25rem',
    '& .MuiButtonBase-root': {
      p: 0,
      '& .MuiSvgIcon-root': {
        color: vars.iconPrimaryColor
      }
    }
  },
  dialogContent: {
    padding: "0 1.5rem 2rem",
  },
  textField: {
    "& .MuiInputBase-root": {
      border: `1px solid ${vars.gray200}`,
      boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
      padding: ".75rem",
      "& .MuiOutlinedInput-notchedOutline": {
        border: 0,
      },
      "& .Mui-focused, &:focus-visible": {
        border: "0 !important",
        boxShadow: "none",
      },
    },
  },
  dialogActions: {
    padding: "0 1.5rem 1.5rem",
  },
};
const AddNote = ({selectedTableRows, entityType}: any) => {
  const [open, setOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const handleOpen = () => {
    setOpen(true);
  };
  
  const handleClose = () => {
    setOpen(false);
  };
  
  const onSubmit = () => {
    // TODO: API call to submit note
    console.log("Submitting note:", noteText, selectedTableRows, entityType);
    handleClose();
  }
  
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNoteText(e.target.value);
  }, []);
  
  return (
    <>
      <Tooltip arrow title="Add a note">
        <IconButton onClick={handleOpen}>
          <NoteAddIcon />
        </IconButton>
      </Tooltip>
      
      <Dialog open={open} onClose={handleClose} fullWidth PaperProps={{sx: styles.dialogPaper}}>
        <DialogTitle sx={styles.dialogTitle}>
          <Typography variant="h5">
            Add a new note
          </Typography>
          <IconButton onClick={handleClose}>
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={styles.dialogContent}>
          <Typography mb='1.25rem'>
            Add a note to {selectedTableRows.length} {selectedTableRows.length === 1 ? 'sentence' : 'sentences'}
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Write your note..."
            sx={styles.textField}
            onChange={handleChange}
          />
        </DialogContent>
        <DialogActions sx={styles.dialogActions}>
          <Button onClick={onSubmit} variant="contained" color="primary" fullWidth>
            Send
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AddNote;
