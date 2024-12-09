import {Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Typography} from "@mui/material";
import React from "react";
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import Stack from "@mui/material/Stack";
import {vars} from "../../theme/variables";
import {DeleteIcon} from "../icons";
const ConfirmationDialog = ({
                              open, onConfirm, onCancel
                            }: {
  open: boolean,
  onConfirm: () => void,
  onCancel: () => void,
}) => {
  return (
    <Dialog open={open} onClose={onCancel} PaperProps={{
      sx: {
        width: '25rem',
        padding: '1.5rem'
      }
    }}>
      <DialogTitle sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        p: 0,
        mb: '1rem',
        
        '& .MuiButtonBase-root': {
          p: 0,
          '& .MuiSvgIcon-root': {
            color: vars.iconPrimaryColor
          }
        }
      }}>
        <DeleteIcon />
        <IconButton onClick={onCancel}>
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{
        p: 0,
        mb: '2rem'
      }}>
        <Stack spacing='.25rem' mb='1.25rem'>
          <Typography variant='h4'>
            Are you sure you want to delete this alert permanently?
          </Typography>
          <Typography variant='body2'>
            By proceeding, this alert will be permanently deleted from the system. This action cannot be undone. Are you sure you want to continue?
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        p: 0,
        '& .MuiButtonBase-root': {
          fontSize: '1rem'
        }
      }}>
        <Button fullWidth onClick={onCancel} color="secondary" variant='outlined'>
          Cancel
        </Button>
        <Button fullWidth onClick={onConfirm} color="primary" variant='contained'>
          Proceed
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ConfirmationDialog;