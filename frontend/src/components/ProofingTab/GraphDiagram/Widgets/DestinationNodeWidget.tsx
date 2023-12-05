import React, { useState } from "react";
import { PortWidget } from '@metacell/meta-diagram';
import { Typography } from "@mui/material";

interface DestinationNodeProps {
    model: any;
    engine: any;
}

export const DestinationNodeWidget: React.FC<DestinationNodeProps> = ({ model, engine }) => {
    // State to toggle the color
    const [isActive, setIsActive] = useState(false);

    // Function to toggle the state
    const toggleColor = () => {
        setIsActive(!isActive);
    };

    return (
        <div
            style={{
                width: '50px',
                height: '50px',
                backgroundColor: isActive ? 'orange' : 'red', // Toggle color based on state
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
                <div className="circle-port"/>
            </PortWidget>
        </div>
    );
};
