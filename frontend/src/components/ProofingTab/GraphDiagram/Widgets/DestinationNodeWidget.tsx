import React from "react";
import {PortWidget} from '@metacell/meta-diagram';
import {Typography} from "@mui/material";

interface DestinationNodeProps {
    model: any;
    engine: any;
}

export const DestinationNodeWidget: React.FC<DestinationNodeProps> = ({ model, engine }) => {
    return (
        <div style={{
            width: '60px',
            height: '60px',
            backgroundColor: 'red',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            position: 'relative'
        }}>
            <Typography>{model.getOptions().name}</Typography>
            <PortWidget engine={engine} port={model.getPort('in')}>
                <div className="circle-port" />
            </PortWidget>
        </div>
    );
};
