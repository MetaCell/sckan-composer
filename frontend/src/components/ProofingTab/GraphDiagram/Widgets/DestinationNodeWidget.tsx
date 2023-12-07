import React, { useState } from "react";
import { PortWidget } from "@metacell/meta-diagram";
import { Typography, Box } from "@mui/material";
import Stack from "@mui/material/Stack";
import { DestinationIcon, OriginIcon, ViaIcon } from "../../../icons";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import { vars } from "../../../../theme/variables";

interface DestinationNodeProps {
  model: any;
  engine: any;
}

export const DestinationNodeWidget: React.FC<DestinationNodeProps> = ({
  model,
  engine,
}) => {
  // State to toggle the color
  const [isActive, setIsActive] = useState(false);
  const [zIndex, setZIndex] = useState(0);

  // Function to toggle the state
  const toggleColor = () => {
    setIsActive(!isActive);
    setZIndex((prevZIndex) => prevZIndex + 1);
  };

  return (
    <Box
      style={{
        display: "flex",
        width: "10rem",
        height: "10rem",
        padding: "0.5rem",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: "0.25rem",
        borderRadius: "0.75rem",
        border: "2px solid #088AB2",
        background: "#ECFDFF",
        boxShadow:
          "0px 4px 10px -4px rgba(8, 138, 178, 0.20), 0px 0px 26px 0px #A5F0FC inset",
      }}
      onClick={toggleColor}
    >
      <Typography
        sx={{
          color: "#088AB2",
          textAlign: "center",
          fontSize: "0.875rem",
          fontWeight: 500,
          lineHeight: "1.25rem",
        }}
      >
        {model.getOptions().name}
      </Typography>
      <PortWidget engine={engine} port={model.getPort("in")}>
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
            border: "2px solid #088AB2",
            background: "#ECFDFF",
            boxShadow: "0px 4px 10px -4px rgba(8, 138, 178, 0.20)",
            position: "absolute",
            top: 0,
            width: "18rem",
            zIndex: isActive ? zIndex : "auto",
          }}
        >
          <Box
            sx={{
              padding: "0.75rem 0.5rem",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
            }}
          >
            <Typography
              sx={{
                color: " #088AB2",
                fontSize: "0.875rem",
                fontWeight: 500,
              }}
            >
              From
            </Typography>
          </Box>
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
              <ViaIcon fill="#088AB2" width={"1rem"} height={"1rem"} />
              <Typography
                sx={{
                  color: "#667085",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  lineHeight: "1.25rem",
                }}
              >
                T6 sympathetic chain
              </Typography>
            </Stack>

            <Divider />
            <Stack
              padding=".5rem"
              spacing={1}
              direction="row"
              alignItems="center"
            >
              <ViaIcon fill="#088AB2" width={"1rem"} height={"1rem"} />
              <Typography
                sx={{
                  color: "#667085",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  lineHeight: "1.25rem",
                }}
              >
                T6 sympathetic chain
              </Typography>
            </Stack>
            <Divider />
            <Stack
              padding=".5rem"
              spacing={1}
              direction="row"
              alignItems="center"
            >
              <ViaIcon fill="#088AB2" width={"1rem"} height={"1rem"} />
              <Typography
                sx={{
                  color: "#667085",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  lineHeight: "1.25rem",
                }}
              >
                T6 sympathetic chain
              </Typography>
            </Stack>
            <Divider />
            <Stack
              padding=".5rem"
              spacing={1}
              direction="row"
              alignItems="center"
            >
              <ViaIcon fill="#088AB2" width={"1rem"} height={"1rem"} />
              <Typography
                sx={{
                  color: "#667085",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  lineHeight: "1.25rem",
                }}
              >
                T6 sympathetic chain
              </Typography>
            </Stack>
          </Box>

          <Stack
            padding="0.75rem 0.5rem"
            alignItems="center"
            justifyContent="center"
            textAlign="center"
            spacing={2}
          >
            <Box
              style={{
                width: "1rem",
                height: "0.125rem",
                backgroundColor: " #06AED4",
                transform: "rotate(90deg)",
              }}
            />
            <DestinationIcon fill="#088AB2" />
            <Typography
              sx={{
                color: " #088AB2",
                fontSize: "0.875rem",
                fontWeight: 500,
                lineHeight: "1.25rem",
              }}
            >
              Prevertebral sympathetic ganglion in abdominal aortic plexus
            </Typography>
            <Typography
              sx={{
                color: " #088AB2",
                fontSize: "0.75rem",
                fontWeight: 400,
                lineHeight: "1.125rem",
                marginTop: ".25rem !important",
              }}
            >
              ILX:0793821
            </Typography>
            <Chip
              label={"Afferent"}
              variant="filled"
              sx={{
                background: "#E2ECFB",
                color: "#184EA2",
                marginLeft: "10px",
                marginRight: "10px",

                "& .MuiChip-deleteIcon": {
                  fontSize: "14px",
                  color: vars.mediumBlue,
                },
              }}
            />
          </Stack>
        </Box>
      )}
    </Box>
  );
};
