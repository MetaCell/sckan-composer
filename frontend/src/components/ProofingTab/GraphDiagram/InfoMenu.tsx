import {Divider, Stack, Typography} from "@mui/material";
import {
    DestinationInfoIcon,
    ForwardConnectionIcon,
    OriginInfoIcon,
    ViaInfoIcon,
} from "./Widgets/icons";
import {DiagramEngine} from "@projectstorm/react-diagrams-core";


interface InfoMenuProps {
    engine: DiagramEngine;
    forwardConnection: boolean;
}
const InfoMenu = (props: InfoMenuProps) => {
    const {engine, forwardConnection} = props
    return engine ? (
        <Stack
            direction="row"
            spacing="1rem"
            alignItems='center'
            sx={{
                borderRadius: "1.75rem",
                border: "0.0394rem solid #EDEFF2",
                background: "rgba(255, 255, 255, 0.5)",
                width: "fit-content",
                boxShadow:
                    "0rem 0.1567rem 0.235rem -0.0783rem rgba(16, 24, 40, 0.03), 0rem 0.47rem 0.6267rem -0.1567rem rgba(16, 24, 40, 0.08)",
                padding: "0 1.25rem",
                height: '3.625rem',
                zIndex: 10,

                "& .MuiDivider-root": {
                    width: '0.0313rem',
                    height: '1.5rem',
                    background: '#D2D7DF'
                },
            }}
        >
            <Stack direction="row" gap={1} alignItems="center">
                <OriginInfoIcon/>
                <Typography
                    sx={{
                        color: "#4A4C4F",
                        fontWeight: 500,
                        lineHeight: 1,
                    }}
                >
                    Origins
                </Typography>
            </Stack>
            <Divider />
            <Stack direction="row" gap={1} alignItems="center">
                <ViaInfoIcon/>
                <Typography
                    sx={{
                        color: "#4A4C4F",
                        fontWeight: 500,
                        lineHeight: 1,
                    }}
                >
                    Via
                </Typography>
            </Stack>
            <Divider />
            <Stack direction="row" gap={1} alignItems="center">
                <DestinationInfoIcon/>
                <Typography
                    sx={{
                        color: "#4A4C4F",
                        lineHeight: 1,
                        fontWeight: 500,
                    }}
                >
                    Destination
                </Typography>
            </Stack>
            { forwardConnection && (<><Divider />
            <Stack direction="row" gap={1} alignItems="center">
                <ForwardConnectionIcon />
                <Typography
                    sx={{
                        color: "#4A4C4F",
                        lineHeight: 1,
                        fontWeight: 500,
                    }}
                >
                    Forward connection
                </Typography>
            </Stack></>) }
        </Stack>
    ) : null;
};

export default InfoMenu;
