import React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import logo from "../assets/logo.svg";

import { userProfile, logout } from "../services/UserService";

const Topbar = () => {
  const profile = userProfile.getProfile();

  const descriptionStyle = {
    minHeight: "inherit",
    bgcolor: "#F7FAFF",
    border: "1px solid #D0D5DD",
    color: "#1D2939",
    display: "flex",
    alignItems: "center",
  };

  const handleClick = async () => {
    await logout();
    userProfile.clearProfile();
    window.location.href = "https://orcid.org/signout";
  };

  return (
    <AppBar
      position="fixed"
      sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, padding: 1 }}
      color="inherit"
    >
      <Toolbar>
        <Box display="flex">
          <Box sx={{height: 24, width: 24}} component="img" display="block" src={logo} alt="Composer logo" />
          <Typography variant="h6" component="div" ml={1.5}>
            SCKAN Composer
          </Typography>
        </Box>
        <Box ml={2.5} mr="auto" px={2.5} sx={descriptionStyle}>
          <Typography>Workspace Admin</Typography>
        </Box>
        <Box display="flex" alignItems="center">
          <Typography variant="h6">
            Welcome, {profile.user.first_name}
          </Typography>
          <Tooltip title="logout">
            <IconButton color="info" onClick={handleClick}>
              <MoreVertIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Topbar;
