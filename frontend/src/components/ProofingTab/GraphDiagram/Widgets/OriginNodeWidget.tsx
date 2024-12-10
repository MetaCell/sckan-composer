import React, { useState, useRef, useEffect } from "react";
import { PortWidget } from "@projectstorm/react-diagrams";
import { Typography, Box } from "@mui/material";
import { DestinationIcon, OriginIcon, ViaIcon } from "./icons";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import { CustomNodeModel } from "../Models/CustomNodeModel";
import { DiagramEngine } from "@projectstorm/react-diagrams-core";
import { NodeTypes } from "../GraphDiagram";

interface OriginNodeProps {
    model: CustomNodeModel;
    engine: DiagramEngine;
}

const VerticalDivider = () => (
    <Box
        style={{
            width: "0.0625rem",
            height: "1rem",
            backgroundColor: " #6C707A",
        }}
    />
);

export const OriginNodeWidget: React.FC<OriginNodeProps> = ({
    model,
    engine,
}) => {
    const [isActive, setIsActive] = useState(false);
    const [zIndex, setZIndex] = useState(0);
    const innerRef = useRef(null);
    const valueRef = useRef(isActive);

    const toggleColor = (event: any) => {
        if (event.shiftKey) {
            setIsActive(!isActive);
            setZIndex((prevZIndex) => prevZIndex + 1);
        }
    };

    const inPort = model.getPort("in");
    const outPort = model.getPort("out");

    const handleDoubleClick = () => {
        valueRef.current = !valueRef.current;
        setIsActive(valueRef.current);
        setZIndex((prevZIndex) => prevZIndex + 1);
    };

    useEffect(() => {
        let localRef: any = undefined;
        if (innerRef !== null && innerRef.current !== null) {
            localRef = innerRef.current;
            // @ts-expect-error I am already checking the innerRef in the if clause
            innerRef.current.addEventListener("dblclick", handleDoubleClick);
        }
        return () => {
            localRef.removeEventListener("dblclick", handleDoubleClick);
        };
    }, []);

    return (
        <Box
            ref={innerRef}
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

            {/* Centered Ports */}
            {inPort && (
                <PortWidget
                    className="inPort"
                    engine={engine}
                    port={inPort}
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: "0.75rem",
                        height: "0.75rem",
                        borderRadius: "50%",
                    }}
                />
            )}

            {outPort && (
                <PortWidget
                    className="outPort"
                    engine={engine}
                    port={outPort}
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: "0.75rem",
                        height: "0.75rem",
                        borderRadius: "50%",
                    }}
                />
            )}

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
                        boxShadow:
                            "0px 4px 8px -2px rgba(16, 24, 40, 0.10), 0px 2px 4px -2px rgba(16, 24, 40, 0.06)",
                        position: "absolute",
                        top: "-1px",
                        width: "18rem",
                        zIndex: isActive ? zIndex : "auto",
                        maxHeight: "36rem",
                    }}
                >
                    <Typography
                        sx={{
                            color: " #6C707A",
                            fontSize: "0.75rem",
                            fontWeight: 400,
                            lineHeight: "1.125rem",
                        }}
                    >
                        From
                    </Typography>
                    <Box
                        sx={{
                            borderRadius: "0.625rem",
                            border: "1px solid #9BA2B0",
                            background: "#FFF",
                            width: "100%",
                        }}
                    >
                        {model
                            .getOptions()
                            .from?.map(
                                (item: { type: string; name: string }, index: number) => (
                                    <React.Fragment key={index}>
                                        <Stack
                                            padding=".5rem"
                                            spacing={1}
                                            direction="row"
                                            alignItems="center"
                                            borderTop={index !== 0 ? "1px solid #9BA2B0" : 0}
                                        >
                                            {item.type === NodeTypes.Destination && (
                                                <DestinationIcon
                                                    fill="#6C707A"
                                                    width={"1rem"}
                                                    height={"1rem"}
                                                />
                                            )}
                                            {item.type === NodeTypes.Via && (
                                                <ViaIcon
                                                    fill="#6C707A"
                                                    width={"1rem"}
                                                    height={"1rem"}
                                                />
                                            )}
                                            <Typography
                                                sx={{
                                                    color: "#6C707A",
                                                    fontSize: "0.875rem",
                                                    fontWeight: 400,
                                                    lineHeight: "1.25rem",
                                                }}
                                            >
                                                {item.name}
                                            </Typography>
                                        </Stack>
                                        {index < (model.getOptions().from?.length ?? 0) - 1 && (
                                            <Divider />
                                        )}
                                    </React.Fragment>
                                )
                            )}
                    </Box>
                    <VerticalDivider />
                    <Stack
                        padding="0.75rem 0.5rem"
                        alignItems="center"
                        justifyContent="center"
                        textAlign="center"
                    >
                        <OriginIcon fill="#6C707A" style={{ marginBottom: ".25rem" }} />
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
                                marginTop: ".12rem !important",
                            }}
                        >
                            {model.externalId}
                        </Typography>
                    </Stack>
                    <VerticalDivider />
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
                        {model
                            .getOptions()
                            .to?.map(
                                (item: { type: string; name: string }, index: number) => (
                                    <React.Fragment key={index}>
                                        {index > 0 && <Divider />}
                                        <Stack
                                            padding=".5rem"
                                            spacing={1}
                                            direction="row"
                                            alignItems="center"
                                            borderTop={index !== 0 ? "1px solid #9BA2B0" : 0}
                                        >
                                            {item.type === NodeTypes.Via && (
                                                <ViaIcon
                                                    fill="#6C707A"
                                                    width={"1rem"}
                                                    height={"1rem"}
                                                />
                                            )}
                                            {item.type === NodeTypes.Destination && (
                                                <DestinationIcon
                                                    fill="#6C707A"
                                                    width={"1rem"}
                                                    height={"1rem"}
                                                />
                                            )}
                                            <Typography
                                                sx={{
                                                    color: "#6C707A",
                                                    fontSize: "0.875rem",
                                                    fontWeight: 400,
                                                    lineHeight: "1.25rem",
                                                }}
                                            >
                                                {item.name}
                                            </Typography>
                                        </Stack>
                                    </React.Fragment>
                                )
                            )}
                    </Box>
                </Box>
            )}
        </Box>
    );
};
