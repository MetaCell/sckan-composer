import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import Toolbar from "@mui/material/Toolbar";
import MenuList from "@mui/material/MenuList";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import { vars } from "../theme/variables";
import { userProfile } from "../services/UserService";
import { useNavigate, useLocation } from "react-router";
import {CONFIRMATION_DIALOG_CONFIG} from "../settings";
import ConfirmationDialog from "./ConfirmationDialog";
import {useDispatch, useSelector} from "react-redux";
import {RootState} from "../redux/store";
import {setDialogState, setPositionChangeOnly, setWasChangeDetected} from "../redux/statementSlice";
import { getSckanComposerVersion } from "../services/CommonService";

const Sidebar = () => {
  const profile = userProfile.getProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const wasChangeDetected = useSelector(
    (state: RootState) => state.statement.wasChangeDetected
  );
  const positionChangeOnly = useSelector((state: RootState) => state.statement.positionChangeOnly);
  
  const dialogsState = useSelector((state: RootState) => state.statement.dialogs);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState({
    selectedItem: 0,
    url: "/",
  });
  
  const sckanComposerVersion = getSckanComposerVersion();

  const userIsCuratorAndTriageOperator =
    profile.is_triage_operator && (profile.is_curator || profile.is_reviewer);

  const initialItem =
    userIsCuratorAndTriageOperator && location.pathname.match("/statement")
      ? 1
      : 0;

  const [selectedItem, setSelectedItem] = useState(initialItem);

  const drawerStyle = {
    width: vars.drawerWidth,
    flexShrink: 0,
    [`& .MuiDrawer-paper`]: {
      width: vars.drawerWidth,
      boxSizing: "border-box",
      borderRadius: 0,
      boxShadow: "none",
      background: vars.sidebarBg,
      padding: 0,
    },
  };
  
  const handleMenuClick = (selectedItem: number, url: string) => {
    setSelectedMenuItem({
      selectedItem,
      url,
    })
    
    if (dialogsState.navigate) {
      navigate(url);
      setSelectedItem(selectedItem);
      dispatch(setWasChangeDetected(false));
      dispatch(setPositionChangeOnly(false));
      return;
    }
    
    if (wasChangeDetected || positionChangeOnly) {
      setIsDialogOpen(true);
    } else {
      navigate(url);
      setSelectedItem(selectedItem);
    }
  };
  
  const handleCancel = () => {
    setIsDialogOpen(false);
  };
  
  const handleConfirm = () => {
    navigate(selectedMenuItem.url);
    setSelectedItem(selectedMenuItem.selectedItem);
    setIsDialogOpen(false);
    dispatch(setWasChangeDetected(false));
    dispatch(setPositionChangeOnly(false));
  };

  useEffect(() => {
    document.getElementById("graph-container")?.scrollIntoView();
    document.getElementById("graph-container")?.focus();
  }
  , [isDialogOpen]);

  return (
    <>
    <Drawer variant="permanent" sx={drawerStyle}>
      <Toolbar />
      <Box flex={1} justifyContent="space-between" display="flex" flexDirection="column">
        <Box sx={{ overflow: "auto" }} color="#D0D5DD">
          <Typography variant="caption" component="p" p={2.5} pb={1}>
            Manage
          </Typography>
          <MenuList variant="selectedMenu" sx={{ p: 0 }}>
            <MenuItem
              sx={{ padding: "0.875rem 1.25rem" }}
              selected={selectedItem === 0}
              onClick={() => handleMenuClick(0, "/")}
            >
              <Typography variant="subtitle1">
                {profile.is_triage_operator
                  ? "Sentences List"
                  : "Statements List"}
              </Typography>
            </MenuItem>
            {userIsCuratorAndTriageOperator && (
              <MenuItem
                sx={{ padding: "0.875rem 1.25rem" }}
                selected={selectedItem === 1}
                onClick={() => handleMenuClick(1, "/statement")}
              >
                <Typography variant="subtitle1">Statements List</Typography>
              </MenuItem>
            )}
          </MenuList>
        </Box>
        <Typography variant="caption" component="p"
          mb={1.5} color="#D0D5DD" mx={'auto'}
        >
          SCKAN Composer version: {sckanComposerVersion}
        </Typography>
      </Box>
    </Drawer>
    <ConfirmationDialog
        open={isDialogOpen}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        title={CONFIRMATION_DIALOG_CONFIG.Navigate.title}
        confirmationText={CONFIRMATION_DIALOG_CONFIG.Navigate.confirmationText}
        Icon={<CONFIRMATION_DIALOG_CONFIG.Navigate.Icon />}
        dontShowAgain={dialogsState.navigate}
        setDontShowAgain={() => dispatch(setDialogState({ dialogKey: "navigate", dontShow: true }))}
      />
    </>
  );
};

export default Sidebar;
