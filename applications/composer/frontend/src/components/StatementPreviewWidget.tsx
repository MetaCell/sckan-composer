import React from 'react';
import {Box} from "@mui/material";
import { getForwardConnectionText } from '../helpers/helpers';

interface StatementPreviewProps {
    value: string;
    options: any;
}

const StatementPreviewWidget: React.FC<StatementPreviewProps> = ({ value, options }) => {
    const forwardConnections = options.option.statement?.forward_connection;
    let baseForwardConnectionText = getForwardConnectionText(forwardConnections);

    return (
        <Box sx={{
            whiteSpace: 'pre-wrap', overflowWrap: 'break-word',
            paddingTop: "8px"
        }}>
            {value}
            <div dangerouslySetInnerHTML={{ __html: baseForwardConnectionText }} />
        </Box>
    );

};

export default StatementPreviewWidget;
