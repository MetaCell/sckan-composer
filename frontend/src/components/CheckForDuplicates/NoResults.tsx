import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import * as React from "react";

export default function NoResults({handleClearSearch}: any) {
    return <Box height="calc(100vh - 125px)"
                sx={{
                    display: "flex",
                    flexGrow: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    flexDirection: "column"
                }}>
        <Box sx={{
            display: "flex",
            flexGrow: 1,
            justifyContent: "center",
            alignItems: "center",
            maxWidth: "25em",
            flexDirection: "column"
        }}>
            <Typography variant="h6">No duplicates found</Typography>
            <Typography sx={{textAlign: "center"}}>We couldn’t find any record with these origin and destination in the
                database.</Typography>
            <Button sx={{margin: "3em", color: "#344054", border: "1px solid #D0D5DD"}} variant="outlined"
                    onClick={() => handleClearSearch()}>
                Clear Search
            </Button>
        </Box>
    </Box>
}