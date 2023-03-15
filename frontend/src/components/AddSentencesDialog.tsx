import * as React from "react";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import SentenceForm from "./Forms/SentenceForm";
import { useNavigate } from "react-router";
import { Sentence } from "../apiclient/backend";

const AddSentencesDialog = (props: any) => {
  const { open, handleClose } = props;
  const navigate = useNavigate();

  const handleSucessfulSubmission = (newSentence: Sentence) => {
    handleClose();
    navigate(`sentence/${newSentence.id}`);
  };

  return (
    <Dialog fullWidth open={open} onClose={handleClose} maxWidth="xs">
      <DialogTitle component="div">
        <Box
          justifyContent="space-between"
          display="flex"
          flex={1}
          alignItems="center"
        >
          <Typography variant="h4">New sentence</Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <Box marginRight={5}>
          <Typography>
            Add a knowledge sentence from an external publication to the SCKAN
            Composer.
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <SentenceForm
          format="create"
          clearOnSave
          enableAutoSave={false}
          action={handleSucessfulSubmission}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AddSentencesDialog;
