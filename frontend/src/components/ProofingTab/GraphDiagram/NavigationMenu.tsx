import {Stack, Divider} from "@mui/material";
import FitScreenOutlinedIcon from "@mui/icons-material/FitScreenOutlined";
import ZoomInOutlinedIcon from "@mui/icons-material/ZoomInOutlined";
import ZoomOutOutlinedIcon from "@mui/icons-material/ZoomOutOutlined";
import SaveIcon from '@mui/icons-material/Save';
import IconButton from "@mui/material/IconButton";
import {DiagramEngine} from "@projectstorm/react-diagrams-core";
import {useState} from "react";
import {PatchedConnectivityStatementUpdate} from "../../../apiclient/backend";
import connectivityStatementService from "../../../services/StatementService";

const ZOOM_CHANGE = 25

interface NavigationMenuProps {
  engine: DiagramEngine;
  statementId: string;
}

const NavigationMenu = (props: NavigationMenuProps) => {
  const {engine, statementId} = props
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
      graph_state: serializedGraph
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

  return engine ? (
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
    </Stack>
  ) : null;
};

export default NavigationMenu;
