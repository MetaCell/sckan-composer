import React from "react";
import {Box} from "@mui/material";
import Typography from "@mui/material/Typography";
import {ConnectivityStatement} from "../../apiclient/backend/api";
import {useTheme} from "@mui/system";
import GraphDiagram from "./GraphDiagram/GraphDiagram";

const StatementChart = (props: { statement: ConnectivityStatement }) => {
    const {statement} = props;
    const theme = useTheme();

    const displayChart = statement.origins && statement.origins.length > 0
        && statement.destinations && statement.destinations.length > 0

    return (
        <Box
            display="flex"
            justifyContent="center"
            sx={{background: theme.palette.grey[100], borderRadius: 1}}
        >
            {displayChart ? (
                <Box sx={{height: '800px', width: '100%'}}>
                    <GraphDiagram origins={statement.origins} vias={statement.vias}
                                  destinations={statement.destinations}
                                  forwardConnection={statement.forward_connection}
                                  graphState={statement.graph_state}
                    />
                </Box>
            ) : (
                <Box p={3}>
                    <Typography>
                        Add Origin and Destination entities to visualize the statement
                        preview
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default StatementChart;
