import {Stack, Divider, CircularProgress, Backdrop, Tooltip, Alert} from "@mui/material";
import FitScreenOutlinedIcon from "@mui/icons-material/FitScreenOutlined";
import ZoomInOutlinedIcon from "@mui/icons-material/ZoomInOutlined";
import ZoomOutOutlinedIcon from "@mui/icons-material/ZoomOutOutlined";
import IconButton from "@mui/material/IconButton";
import {DiagramEngine} from "@projectstorm/react-diagrams-core";
import React, {useState} from "react";
import {PatchedConnectivityStatementUpdate} from "../../../apiclient/backend";
import connectivityStatementService from "../../../services/StatementService";
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined';
import CameraswitchOutlinedIcon from '@mui/icons-material/CameraswitchOutlined';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import CustomSwitch from "../../CustomSwitch";
import ConfirmationDialog from "../../ConfirmationDialog";
import {CONFIRMATION_DIALOG_CONFIG} from "../../../settings";
import {useSelector} from "react-redux";
import {RootState} from "../../../redux/store";
const ZOOM_CHANGE = 25

interface NavigationMenuProps {
  engine: DiagramEngine;
  statementId: string;
  rankdir: string;
  toggleRankdir: () => void;
  resetGraph: () => void;
  isGraphLocked: boolean;
  switchLockedGraph: (locked: boolean) => void;
}

const NavigationMenu = (props: NavigationMenuProps) => {
  const {engine, statementId, toggleRankdir, resetGraph, isGraphLocked, switchLockedGraph} = props
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({
    title: "",
    confirmationText: "",
    Icon: <></> as React.ReactNode,
    onConfirm: () => {},
  });
  
  const wasChangeDetected = useSelector((state: RootState) => state.statement.wasChangeDetected);
  
  const openDialog = (config: {
    title: string;
    confirmationText: string;
    Icon: React.ReactNode;
    onConfirm: () => void;
  }) => {
    setDialogConfig(config);
    setIsConfirmationDialogOpen(true);
  };
  
  const closeDialog = () => {
    setIsConfirmationDialogOpen(false);
  };
  const zoomOut = () => {
    const zoomLevel = engine.getModel().getZoomLevel();
    engine.getModel().setZoomLevel(zoomLevel - ZOOM_CHANGE);
    engine.repaintCanvas();
  };

  const zoomIn = () => {
    const zoomLevel = engine.getModel().getZoomLevel();
    engine.getModel().setZoomLevel(zoomLevel + ZOOM_CHANGE);
    engine.repaintCanvas();

  };

  const saveGraph = async () => {
    setIsSaving(true)

    // Serialize the diagram model
    const model = engine.getModel()
    const serializedGraph = model.serialize()

    const patchData: PatchedConnectivityStatementUpdate = {
      graph_rendering_state: {serialized_graph: serializedGraph}
    }

    try {
      await connectivityStatementService.partialUpdate(parseInt(statementId, 10), patchData)
    } catch (error) {
      // TODO: Provide proper feedback
      console.error("Error saving graph:", error)
    } finally {
      setIsSaving(false)
    }
  }

  return <>
    {
      isSaving ? (
        <Backdrop open={isSaving}>
          <CircularProgress color="inherit"/>
        </Backdrop>
      ) : (
        <Stack
          direction="row"
          spacing="1rem"
          alignItems='center'
          justifyContent="space-between"
          sx={{
            p: '1.5rem .5rem',
            "& .MuiSvgIcon-root": {
              color: "#6C707A",
            },
            
            "& .MuiDivider-root": {
              borderColor: "#EAECF0",
              borderWidth: 0.5,
              height: '1.5rem'
            },
            "& .MuiButtonBase-root": {
              padding: 0,
              
              '&.Mui-disabled': {
                "& .MuiSvgIcon-root": {
                  color: '#caced1',
                },
              }
            },
          }}
        >
          <Stack direction="row" alignItems='center' spacing="1rem" sx={{
            "& .MuiButtonBase-root": {
              borderRadius: '4px',
              padding: '0 !important',
              "&:hover": {
                backgroundColor: "#EDEFF2",
                borderRadius: '4px',
                padding: '2px',
                "& .MuiSvgIcon-root": {
                  color: "#2F3032",
                },
              },
            },
          }}>
            <Tooltip arrow title='Zoom in'>
              <IconButton onClick={() => zoomIn()}>
                <ZoomInOutlinedIcon/>
              </IconButton>
            </Tooltip>
            <Tooltip arrow title='Zoom Out'>
              <IconButton>
                <ZoomOutOutlinedIcon onClick={() => zoomOut()}/>
              </IconButton>
            </Tooltip>
            <Tooltip arrow title='Autoscale'>
              <IconButton onClick={() => engine.zoomToFit()}>
                <FitScreenOutlinedIcon/>
              </IconButton>
            </Tooltip>
            <Tooltip arrow title='Switch orientation'>
              <IconButton onClick={() =>
                openDialog({
                  title: CONFIRMATION_DIALOG_CONFIG.Redraw.title,
                  confirmationText: CONFIRMATION_DIALOG_CONFIG.Redraw.confirmationText,
                  Icon: <CONFIRMATION_DIALOG_CONFIG.Redraw.Icon />,
                  onConfirm: () => {
                    toggleRankdir();
                    closeDialog();
                  },
                })
              } disabled={isGraphLocked}>
                <CameraswitchOutlinedIcon />
              </IconButton>
            </Tooltip>
            <Divider />
            <Tooltip arrow title='Reset to default visualisation'>
              <IconButton onClick={() =>
                openDialog({
                  title: CONFIRMATION_DIALOG_CONFIG.Redraw.title,
                  confirmationText: CONFIRMATION_DIALOG_CONFIG.Redraw.confirmationText,
                  Icon: <CONFIRMATION_DIALOG_CONFIG.Redraw.Icon />,
                  onConfirm: () => {
                    resetGraph();
                    closeDialog();
                  },
                })
              } disabled={isGraphLocked}>
                <RestartAltOutlinedIcon />
              </IconButton>
            </Tooltip>
          </Stack>
          <Stack direction="row" spacing="1rem" alignItems='center'>
            {
              wasChangeDetected ?
                <Tooltip arrow title='This diagram does not match the Path Builder. It will be updated with default routing if you leave this page.'>
                  <Alert severity="warning">The diagram is outdated, please use the reset button on the left to update the diagram</Alert>
                </Tooltip> :
                <Tooltip arrow title='The diagram is saved for all users'>
                  <CheckCircleOutlineRoundedIcon sx={{
                    color: "#039855 !important",
                  }} />
                </Tooltip>
            }
            <Divider />
            <CustomSwitch disabled={wasChangeDetected} locked={isGraphLocked} setLocked={() => openDialog({
              title: isGraphLocked
                ? CONFIRMATION_DIALOG_CONFIG.Locked.title
                : CONFIRMATION_DIALOG_CONFIG.Unlocked.title,
              confirmationText: isGraphLocked
                ? CONFIRMATION_DIALOG_CONFIG.Locked.confirmationText
                : CONFIRMATION_DIALOG_CONFIG.Unlocked.confirmationText,
              Icon: isGraphLocked
                ? <CONFIRMATION_DIALOG_CONFIG.Locked.Icon/>
                : <CONFIRMATION_DIALOG_CONFIG.Unlocked.Icon/>,
              onConfirm: () => {
                switchLockedGraph(!isGraphLocked);
                closeDialog();
              },
            })}
            />
          </Stack>
        </Stack>
      )
    }
    <ConfirmationDialog
      open={isConfirmationDialogOpen}
      onConfirm={dialogConfig.onConfirm}
      onCancel={closeDialog}
      title={dialogConfig.title}
      confirmationText={dialogConfig.confirmationText}
      Icon={dialogConfig.Icon}
    />
  </>
};

export default NavigationMenu;
