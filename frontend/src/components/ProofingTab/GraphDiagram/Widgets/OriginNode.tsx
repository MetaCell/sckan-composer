import React from "react";
import {PortWidget} from '@metacell/meta-diagram';

interface OriginNodeProps {
    model: any;
    engine: any;
}

export const OriginNode: React.FC<OriginNodeProps> = ({model, engine}) => {
    return (
        <div style={{
            width: '50px',
            height: '50px',
            backgroundColor: 'blue',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            position: 'relative'
        }}>
            Origin
            <PortWidget engine={engine} port={model.getPort('out')}>
                <div className="circle-port"/>
            </PortWidget>
        </div>
    );
};
