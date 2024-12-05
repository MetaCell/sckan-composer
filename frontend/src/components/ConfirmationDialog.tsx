import {Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, IconButton, Typography} from "@mui/material";
import React from "react";
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import Stack from "@mui/material/Stack";
import { vars } from "../theme/variables";
import CustomCheckBox from "./CustomCheckBox";
const ConfirmationDialog = ({
  open, onConfirm, onCancel, title, confirmationText, Icon, dontShowAgain, setDontShowAgain
}: {
  open: boolean,
  onConfirm: () => void,
  onCancel: () => void,
  title: string,
  confirmationText: string,
  Icon: React.ReactNode,
  dontShowAgain?: boolean;
  setDontShowAgain?: (checked: boolean) => void;
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
        {Icon}
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
            {title}
          </Typography>
          <Typography variant='body2' color={vars.gray600}>
            {confirmationText}
          </Typography>
        </Stack>
        <FormControlLabel
          sx={{ml: 0}}
          control={
            <CustomCheckBox
              checked={dontShowAgain || false}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDontShowAgain?.(e.target.checked)}
            />
          }
          label="Don't show this again for this session." />
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