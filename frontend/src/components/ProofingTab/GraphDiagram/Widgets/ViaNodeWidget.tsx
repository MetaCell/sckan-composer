import React, {useState} from "react";
import {PortWidget} from "@projectstorm/react-diagrams";
import {Typography, Box} from "@mui/material";
import Stack from "@mui/material/Stack";
import {DestinationIcon, OriginIcon, ViaIcon} from "../../../icons";
import Divider from "@mui/material/Divider";
import {vars} from "../../../../theme/variables";
import Chip from "@mui/material/Chip";
import {AnatomicalEntity} from "../../../../apiclient/backend";
import {NodeTypes} from "../GraphDiagram";

interface ViaNodeProps {
    model: any;
    engine: any;
}

export const ViaNodeWidget: React.FC<ViaNodeProps> = ({model, engine}) => {
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
                borderRadius: "3.25rem",
                border: "2px solid #0E9384",
                background: "#F0FDF9",
                boxShadow:
                    "0px 4px 10px -4px rgba(14, 147, 132, 0.20), 0px 0px 26px 0px #99F6E0 inset",
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
            <PortWidget engine={engine} port={model.getPort("in")}>
                <div className="circle-port"/>
            </PortWidget>
            <PortWidget engine={engine} port={model.getPort("out")}>
                <div className="circle-port"/>
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
                        maxHeight: "36rem",
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
                                color: " #039855",
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
                        {model.options.from && model.options.from.map((item: { type: NodeTypes; name: string }, index: number) => (
                            <React.Fragment key={index}>
                                <Stack
                                    padding=".5rem"
                                    spacing={1}
                                    direction="row"
                                    alignItems="center"
                                >
                                    {item.type === NodeTypes.Origin && <OriginIcon fill="#088AB2" width={"1rem"} height={"1rem"} />}
                                    {item.type === NodeTypes.Via && <ViaIcon fill="#088AB2" width={"1rem"} height={"1rem"} />}
                                    <Typography
                                        sx={{
                                            color: "#667085",
                                            fontSize: "0.875rem",
                                            fontWeight: 500,
                                            lineHeight: "1.25rem",
                                        }}
                                    >
                                        {item.name}
                                    </Typography>
                                </Stack>
                                {index < model.options.from.length - 1 && <Divider/>}
                            </React.Fragment>
                        ))}
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
                                backgroundColor: " #0E9384",
                                transform: "rotate(90deg)",
                            }}
                        />
                        <ViaIcon fill="#0E9384"/>
                        <Typography
                            sx={{
                                color: " #0E9384",
                                fontSize: "0.875rem",
                                fontWeight: 500,
                                lineHeight: "1.25rem",
                            }}
                        >
                            {model.name}
                        </Typography>
                        <Typography
                            sx={{
                                color: " #0E9384",
                                fontSize: "0.75rem",
                                fontWeight: 400,
                                lineHeight: "1.125rem",
                                marginTop: ".25rem !important",
                            }}
                        >
                            {model.externalId}
                        </Typography>
                        <Chip
                            label={model.options.anatomicalType}
                            variant="filled"
                            sx={{
                                background: vars.lightBlue,
                                color: vars.darkBlue,
                                marginLeft: "10px",
                                marginRight: "10px",

                                "& .MuiChip-deleteIcon": {
                                    fontSize: "14px",
                                    color: vars.mediumBlue,
                                },
                            }}
                        />
                        <Box
                            style={{
                                width: "1rem",
                                height: "0.125rem",
                                backgroundColor: " #0E9384",
                                transform: "rotate(90deg)",
                            }}
                        />
                        <Typography
                            sx={{
                                color: " #039855",
                                fontSize: "0.875rem",
                                fontWeight: 500,
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
                        {model.options.to.map((item: { type: NodeTypes; name: string }, index: number) => (
                            <React.Fragment key={index}>
                                {index > 0 && <Divider/>}
                                <Stack padding=".5rem" spacing={1} direction="row" alignItems="center">
                                    {item.type === NodeTypes.Via &&
                                        <ViaIcon fill="#039855" width={"1rem"} height={"1rem"}/>}
                                    {item.type === NodeTypes.Destination &&
                                        <DestinationIcon fill="#0E9384" width={"1rem"} height={"1rem"}/>}
                                    <Typography sx={{
                                        color: "#667085",
                                        fontSize: "0.875rem",
                                        fontWeight: 500,
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
