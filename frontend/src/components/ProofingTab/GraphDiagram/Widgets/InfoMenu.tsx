import React from "react";
import { Stack, Divider, Typography } from "@mui/material";
import FitScreenOutlinedIcon from "@mui/icons-material/FitScreenOutlined";
import ZoomInOutlinedIcon from "@mui/icons-material/ZoomInOutlined";
import ZoomOutOutlinedIcon from "@mui/icons-material/ZoomOutOutlined";
import IconButton from "@mui/material/IconButton";
import {
  DestinationInfoIcon,
  OriginInfoIcon,
  ViaInfoIcon,
} from "../../../icons";

const InfoMenu = (props: any) => {
  return (
    <Stack
      direction="row"
      spacing="1rem"
      sx={{
        borderRadius: "1.75rem",
        border: "1px solid #F2F4F7",
        background: "#FFFFFF7F",
        backgroundFilter: "blur(4px)",
        width: "fit-content",
        boxShadow:
          "0px 4px 6px -2px rgba(16, 24, 40, 0.03), 0px 12px 16px -4px rgba(16, 24, 40, 0.08)",
        padding: "0.75rem 1.25rem",
        position: "sticky",
        top: 0,

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
      <Stack direction="row" alignItems="center">
        <OriginInfoIcon />
        <Typography
          sx={{
            color: "#039855",
            fontWeight: 500,
          }}
        >
          Origins
        </Typography>
      </Stack>
      <Stack direction="row" alignItems="center">
        <ViaInfoIcon />
        <Typography
          sx={{
            color: "#0E9384",
            fontWeight: 500,
          }}
        >
          Via
        </Typography>
      </Stack>
      <Stack direction="row" alignItems="center">
        <DestinationInfoIcon />
        <Typography
          sx={{
            color: "#088AB2",
            fontWeight: 500,
          }}
        >
          Destination
        </Typography>
      </Stack>
    </Stack>
  );
};

export default InfoMenu;
