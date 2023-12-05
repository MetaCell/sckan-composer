import React, { useState } from "react";
import { PortWidget } from '@metacell/meta-diagram';
import { Typography } from "@mui/material";

interface ViaNodeProps {
    model: any;
    engine: any;
}

export const ViaNodeWidget: React.FC<ViaNodeProps> = ({ model, engine }) => {
    // State to toggle the color
    const [isActive, setIsActive] = useState(false);

    // Function to toggle the state
    const toggleColor = () => {
        setIsActive(!isActive);
    };

    return (
        <div
            style={{
                width: '60px',
                height: '60px',
                backgroundColor: isActive ? 'teal' : 'green',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                position: 'relative',
                cursor: 'pointer',
            }}
            onClick={toggleColor}
        >
            <Typography>{model.getOptions().name}</Typography>
            <PortWidget engine={engine} port={model.getPort('in')}>
                <div className="circle-port" />
            </PortWidget>
            <PortWidget engine={engine} port={model.getPort('out')}>
                <div className="circle-port" />
            </PortWidget>
        </div>
    );
};
