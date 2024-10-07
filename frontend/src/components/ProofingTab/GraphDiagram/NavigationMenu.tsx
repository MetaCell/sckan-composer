import {Stack, Divider, CircularProgress, Backdrop} from "@mui/material";
import FitScreenOutlinedIcon from "@mui/icons-material/FitScreenOutlined";
import ZoomInOutlinedIcon from "@mui/icons-material/ZoomInOutlined";
import ZoomOutOutlinedIcon from "@mui/icons-material/ZoomOutOutlined";
import RefreshIcon from '@mui/icons-material/Refresh';
import SaveIcon from '@mui/icons-material/Save';
import IconButton from "@mui/material/IconButton";
import {DiagramEngine} from "@projectstorm/react-diagrams-core";
import React, {useState} from "react";
import {PatchedConnectivityStatementUpdate} from "../../../apiclient/backend";
import connectivityStatementService from "../../../services/StatementService";

const ZOOM_CHANGE = 25

interface NavigationMenuProps {
  engine: DiagramEngine;
  statementId: string;
  needsRefresh: boolean | undefined;
}

const NavigationMenu = (props: NavigationMenuProps) => {
  const {engine, statementId, needsRefresh} = props
  const [isSaving, setIsSaving] = useState<boolean>(false)


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

  const refreshDiagram = () => {
    console.log("Update graph")
    console.log("Save graph")
  };

  return isSaving ? (
    <Backdrop open={isSaving}>
      <CircularProgress color="inherit"/>
    </Backdrop>
  ) : (
    <Stack
      direction="row"
      spacing="1rem"
      sx={{
        borderRadius: "1.75rem",
        border: "1px solid #F2F4F7",
        background: "#FFF",
        width: "fit-content",
        boxShadow:
          "0px 4px 6px -2px rgba(16, 24, 40, 0.03), 0px 12px 16px -4px rgba(16, 24, 40, 0.08)",
        padding: "0.75rem 1.25rem",
        position: "absolute",
        top: 8,
        right: 8,
        zIndex: 10,

        "& .MuiSvgIcon-root": {
          color: "#475467",
        },

        "& .MuiDivider-root": {
          borderColor: "#EAECF0",
          borderWidth: 0.5,
        },
        "& .MuiButtonBase-root": {
          padding: 0,

          "&:hover": {
            backgroundColor: "transparent",
          },
        },
      }}
    >
      <IconButton onClick={() => engine.zoomToFit()}>
        <FitScreenOutlinedIcon/>
      </IconButton>
      <Divider/>
      <IconButton onClick={() => zoomIn()}>
        <ZoomInOutlinedIcon/>
      </IconButton>
      <IconButton>
        <ZoomOutOutlinedIcon onClick={() => zoomOut()}/>
      </IconButton>
      <IconButton onClick={() => saveGraph()}>
        <SaveIcon/>
      </IconButton>
      <IconButton
        onClick={refreshDiagram}
        disabled={!needsRefresh}
        color={needsRefresh ? "primary" : "default"}
        sx={{
          opacity: !needsRefresh ? 0.5 : 1,
          cursor: !needsRefresh ? "not-allowed" : "pointer",
          color: !needsRefresh ? "rgba(0, 0, 0, 0.26)" : "inherit",
        }}
      >
        <RefreshIcon/>
      </IconButton>
    </Stack>
  )
};

export default NavigationMenu;
