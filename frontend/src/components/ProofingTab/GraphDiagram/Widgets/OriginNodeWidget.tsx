import React, { useState } from "react";
import { PortWidget } from "@metacell/meta-diagram";
import { Typography, Box } from "@mui/material";
import { OriginIcon, ViaIcon } from "../../../icons";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";

interface OriginNodeProps {
  model: any;
  engine: any;
}

export const OriginNodeWidget: React.FC<OriginNodeProps> = ({
  model,
  engine,
}) => {
  const [isActive, setIsActive] = useState(false);
  const [zIndex, setZIndex] = useState(0);

  const toggleColor = () => {
    setIsActive(!isActive);
    setZIndex((prevZIndex) => prevZIndex + 1);
  };

  return (
    <Box
      style={{
        position: "relative",
        display: "flex",
        width: "10rem",
        height: "10rem",
        padding: "0.5rem",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: "0.25rem",
        borderRadius: "50rem",
        border: "2px solid #039855",
        background: "#ECFDF3",
        boxShadow:
          "0px 4px 10px -4px rgba(3, 152, 85, 0.20), 0px 0px 26px 0px #A6F4C5 inset",
      }}
      onClick={toggleColor}
    >
      <Typography
        sx={{
          color: "#0E9384",
          textAlign: "center",
          fontSize: "0.875rem",
          fontWeight: 500,
          lineHeight: "1.25rem",
        }}
      >
        {model.name}
      </Typography>
      <PortWidget engine={engine} port={model.getPort("out")}>
        <div className="circle-port" />
      </PortWidget>

      {isActive && (
        <Box
          style={{
            display: "flex",
            padding: "0.5rem",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.25rem",
            borderRadius: "0.75rem",
            border: "2px solid #039855",
            background: "#ECFDF3",
            boxShadow: "0px 4px 10px -4px rgba(3, 152, 85, 0.20)",
            position: "absolute",
            top: 0,
            width: "18rem",
            zIndex: isActive ? zIndex : "auto",
          }}
        >
          <Stack
            padding="0.75rem 0.5rem"
            alignItems="center"
            justifyContent="center"
            textAlign="center"
            spacing={2}
          >
            <OriginIcon fill="#039855" />
            <Typography
              sx={{
                color: " #039855",
                fontSize: "0.875rem",
                fontWeight: 500,
                lineHeight: "1.25rem",
              }}
            >
              Intermediolateral nucleus of eleventh thoracic segment
            </Typography>
            <Typography
              sx={{
                color: " #039855",
                fontSize: "0.75rem",
                fontWeight: 400,
                lineHeight: "1.125rem",
                marginTop: ".25rem !important",
              }}
            >
              ILX:0793815
            </Typography>
            <Box
              style={{
                width: "1rem",
                height: "0.125rem",
                backgroundColor: " #12B76A",
                transform: "rotate(90deg)",
              }}
            />
            <Typography
              sx={{
                color: " #039855",
                fontSize: "0.875rem",
                fontWeight: 500,
                lineHeight: "1.25rem",
              }}
            >
              To
            </Typography>
          </Stack>
          <Box
            sx={{
              borderRadius: "0.625rem",
              border: "1px solid #EAECF0",
              background: "#FFF",
              width: "100%",
            }}
          >
            <Stack
              padding=".5rem"
              spacing={1}
              direction="row"
              alignItems="center"
            >
              <ViaIcon fill="#039855" width={"1rem"} height={"1rem"} />
              <Typography
                sx={{
                  color: "#667085",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  lineHeight: "1.25rem",
                }}
              >
                Greater Splanchnic Nerve
              </Typography>
            </Stack>

            <Divider />
            <Stack
              padding=".5rem"
              spacing={1}
              direction="row"
              alignItems="center"
            >
              <ViaIcon fill="#039855" width={"1rem"} height={"1rem"} />
              <Typography
                sx={{
                  color: "#667085",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  lineHeight: "1.25rem",
                }}
              >
                Greater Splanchnic Nerve
              </Typography>
            </Stack>
          </Box>
        </Box>
      )}
    </Box>
  );
};
