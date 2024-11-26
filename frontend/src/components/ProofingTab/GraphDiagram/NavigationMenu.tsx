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
const ZOOM_CHANGE = 25

interface NavigationMenuProps {
  engine: DiagramEngine;
  statementId: string;
  rankdir: string;
  toggleRankdir: () => void;
  resetGraph: () => void;
  lockedGraph: boolean;
  setLockedGraph: (locked: boolean) => void;
}

const NavigationMenu = (props: NavigationMenuProps) => {
  const {engine, statementId, toggleRankdir, resetGraph, lockedGraph, setLockedGraph} = props
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [viewWarningAlert, setViewWarningAlert] = useState<boolean>(false)
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

  return isSaving ? (
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
          <IconButton onClick={toggleRankdir} disabled={lockedGraph}>
            <CameraswitchOutlinedIcon />
          </IconButton>
        </Tooltip>
        <Divider />
        {/*<IconButton onClick={() => saveGraph()}>*/}
        {/*  <SaveIcon/>*/}
        {/*</IconButton>*/}
        <Tooltip arrow title='Reset to default visualisation'>
          <IconButton onClick={resetGraph} disabled={lockedGraph}>
            <RestartAltOutlinedIcon />
          </IconButton>
        </Tooltip>
      </Stack>
      <Stack direction="row" spacing="1rem" alignItems='center'>
        {
          viewWarningAlert ?
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
         <CustomSwitch locked={lockedGraph} setLocked={setLockedGraph} />
      </Stack>
    </Stack>
  )
};

export default NavigationMenu;
