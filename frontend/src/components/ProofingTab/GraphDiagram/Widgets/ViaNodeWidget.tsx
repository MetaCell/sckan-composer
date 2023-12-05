import React from "react";
import {PortWidget} from '@metacell/meta-diagram';
import {Typography} from "@mui/material";

interface ViaNodeProps {
    model: any;
    engine: any;
}

export const ViaNodeWidget: React.FC<ViaNodeProps> = ({ model, engine }) => {
    return (
        <div style={{
            width: '60px',
            height: '60px',
            backgroundColor: 'green',
            borderRadius: '10px',
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
            <PortWidget engine={engine} port={model.getPort('out')}>
                <div className="circle-port" />
            </PortWidget>
        </div>
    );
};
