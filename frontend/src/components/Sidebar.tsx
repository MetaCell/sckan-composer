import React, { useState } from "react";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import Toolbar from "@mui/material/Toolbar";
import MenuList from "@mui/material/MenuList";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import { vars } from "../theme/variables";
import { userProfile } from "../services/UserService";
import { useNavigate } from "react-router";

const Sidebar = () => {
  const [selectedItem, setSelectedItem] = useState(0);

  const profile = userProfile.getProfile();
  const navigate = useNavigate();

  const drawerStyle = {
    width: vars.drawerWidth,
    flexShrink: 0,
    [`& .MuiDrawer-paper`]: {
      width: vars.drawerWidth,
      boxSizing: "border-box",
      borderRadius: 0,
      boxShadow: "none",
      background: vars.sidebarBg,
    },
  };

  return (
    <Drawer variant="permanent" sx={drawerStyle}>
      <Toolbar />
      <Box sx={{ overflow: "auto" }} color="#D0D5DD">
        <Typography variant="caption" component="p" p={2.5} pb={1}>
          Manage
        </Typography>
        <MenuList variant="selectedMenu" sx={{ p: 0 }}>
          <MenuItem
            sx={{ padding: "0.875rem 1.25rem" }}
            selected={selectedItem === 0}
            onClick={() => {
              setSelectedItem(0);
              navigate("/");
            }}
          >
            <Typography variant="subtitle1">
              {profile.is_triage_operator
                ? "Sentences List"
                : "Statements List"}
            </Typography>
          </MenuItem>
          <MenuItem
            sx={{ padding: "0.875rem 1.25rem" }}
            selected={selectedItem === 1}
            onClick={() => setSelectedItem(1)}
          >
            <Typography variant="subtitle1">Collabotators</Typography>
          </MenuItem>
        </MenuList>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
