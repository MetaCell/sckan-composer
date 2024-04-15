import React, {useState} from "react";
import {PortWidget} from "@projectstorm/react-diagrams";
import {Typography, Box} from "@mui/material";
import {DestinationIcon, OriginIcon, ViaIcon} from "./icons";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import {CustomNodeModel} from "../Models/CustomNodeModel";
import {DiagramEngine} from "@projectstorm/react-diagrams-core";
import {NodeTypes} from "../GraphDiagram";

interface OriginNodeProps {
    model: CustomNodeModel;
    engine: DiagramEngine;
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

    const outPort = model.getPort("out");

    return (
        <Box
            style={{
                position: "relative",
                display: "flex",
                width: "9.25rem",
                height: "9.25rem",
                padding: "0.5rem 0.75rem",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                gap: "0.25rem",
                borderRadius: "50%",
                border: "1.253px solid #6C707A",
                background: "rgba(246, 247, 249)",
                boxShadow:
                "0px 1px 3px 0px rgba(16, 24, 40, 0.10), 0px 1px 2px 0px rgba(16, 24, 40, 0.06)",
            }}
            onClick={toggleColor}
        >
            <Typography
                sx={{
                    color: "#4A4C4F",
                    textAlign: "center",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    lineHeight: "1.25rem",
                }}
            >
                {model.name}
            </Typography>
            {outPort && <PortWidget className="outPort" engine={engine} port={outPort}>
              <div className="outPort"/>
            </PortWidget>
            }

            {isActive && (
                <Box
                    style={{
                        display: "flex",
                        padding: "0.5rem",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "0.25rem",
                        borderRadius: "0.75rem",
                        border: "1.25px solid #6C707A",
                        background: "#F6F7F9",
                        boxShadow: "0px 4px 8px -2px rgba(16, 24, 40, 0.10), 0px 2px 4px -2px rgba(16, 24, 40, 0.06)",
                        position: "absolute",
                        top: -5,
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
                        <OriginIcon fill="#6C707A"/>
                        <Typography
                            sx={{
                                color: " #4A4C4F",
                                fontSize: "0.875rem",
                                fontWeight: 500,
                                lineHeight: "1.25rem",
                            }}
                        >
                            {model.name}
                        </Typography>
                        <Typography
                            sx={{
                                color: " #6C707A",
                                fontSize: "0.75rem",
                                fontWeight: 400,
                                lineHeight: "1.125rem",
                                marginTop: ".25rem !important",
                            }}
                        >
                            {model.externalId}
                        </Typography>
                    </Stack>
                      <Box
                        style={{
                          width: "1rem",
                          height: "0.0625rem",
                          backgroundColor: " #6C707A",
                          transform: "rotate(90deg)",
                          marginBottom: '.5rem'
                        }}
                      />
                      <Typography
                        sx={{
                          color: " #6C707A",
                          fontSize: "0.75rem",
                          fontWeight: 400,
                          lineHeight: "1.125rem",
                        }}
                      >
                        To
                      </Typography>
                    <Box
                        sx={{
                            borderRadius: "0.625rem",
                            border: "1px solid #9BA2B0",
                            background: "#FFF",
                            width: "100%",
                        }}
                    >
                        {model.getOptions().to?.map((item: { type: string; name: string }, index: number) => (
                          <React.Fragment key={index}>
                            {index > 0 && <Divider/>}
                            <Stack padding=".5rem" spacing={1} direction="row" alignItems="center" borderTop={index !== 0 ? '1px solid #9BA2B0' : 0}>
                              {item.type === NodeTypes.Via &&
                                  <ViaIcon fill="#6C707A" width={"1rem"} height={"1rem"}/>}
                              {item.type === NodeTypes.Destination &&
                                  <DestinationIcon fill="#6C707A" width={"1rem"} height={"1rem"}/>}
                              <Typography sx={{
                                color: "#6C707A",
                                fontSize: "0.875rem",
                                fontWeight: 400,
                                lineHeight: "1.25rem"
                              }}>
                                {item.name}
                              </Typography>
                            </Stack>
                          </React.Fragment>
                        ))}
                    </Box>
                </Box>
            )}
        </Box>
    );
};
