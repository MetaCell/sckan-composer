import React from 'react';
import {Box} from "@mui/material";

interface StatementPreviewProps {
    value: string;
}

const StatementPreviewWidget: React.FC<StatementPreviewProps> = ({value}) => {
    return (
        <Box sx={{
            whiteSpace: 'pre-wrap', overflowWrap: 'break-word',
            padding: "8px"
        }}>
            {value}
        </Box>
    );
};

export default StatementPreviewWidget;
