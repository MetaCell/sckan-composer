import React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import logo from "../assets/logo.svg";
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import { userProfile, logout } from "../services/UserService";
import theme from "../theme/Theme";
import { vars } from "../theme/variables";
const { titleFontColor } = vars
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
      sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, p:0 }}
      color="inherit"
    >
      <Toolbar>
        <Box display="flex">
          <Box sx={{height: 24, width: 24}} component="img" display="block" src={logo} alt="Composer logo" />
          <Typography variant="h6" component="div" ml={1.5} color={titleFontColor}>
            SCKAN Composer
          </Typography>
        </Box>
        <Box ml={2.5} mr="auto" px={2.5} sx={descriptionStyle}>
          <Typography
            style={{ cursor: "pointer" }}
            onClick={() => {
              window.open(window.location.origin + "/admin/", "_blank");
            }}
          >
            Admin Workspace
          </Typography>
        </Box>
        <Box display="flex" alignItems="center">
          <Typography variant="h6" color={theme.palette.info.main}>
            Welcome, {profile.user.first_name}
          </Typography>
          <Tooltip title="logout">
            <IconButton onClick={handleClick}>
              <LogoutRoundedIcon sx={{ fontSize: '1.25rem', color: theme.palette.info.main}} />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Topbar;
