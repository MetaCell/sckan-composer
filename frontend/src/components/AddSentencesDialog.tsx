import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";

const AddSentencesDialog = (props: any) => {
  const { open, handleClose } = props;
  return (
    <Dialog fullWidth open={open} onClose={handleClose} maxWidth="xs">
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4">New sentence</Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <Typography>
          Add a knowledge sentence from an external publication to the SCKAN
          Composer.
        </Typography>
      </DialogTitle>
      <DialogContent></DialogContent>
    </Dialog>
  );
};

export default AddSentencesDialog;
