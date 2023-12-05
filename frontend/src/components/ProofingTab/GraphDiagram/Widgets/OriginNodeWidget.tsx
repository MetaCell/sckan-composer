import React, { useState } from "react";
import { PortWidget } from '@metacell/meta-diagram';
import { Typography } from "@mui/material";

interface OriginNodeProps {
    model: any;
    engine: any;
}

export const OriginNodeWidget: React.FC<OriginNodeProps> = ({ model, engine }) => {
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
                backgroundColor: isActive ? 'aqua' : 'blue', // Toggle color based on state
                borderRadius: '50%',
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
            <PortWidget engine={engine} port={model.getPort('out')}>
                <div className="circle-port"/>
            </PortWidget>
        </div>
    );
};
