import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import * as React from "react";

export default function NoSearch() {
    return <Box sx={{display: "flex", flexGrow: 1, justifyContent: "center", alignItems: "center"}}
                height="calc(100vh - 125px)">
        <Typography>Add origin and destination to find duplicates</Typography>
    </Box>
}
