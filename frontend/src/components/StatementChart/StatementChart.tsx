import React from "react";
import { Box } from "@mui/material";
import Typography from "@mui/material/Typography";
import { ConnectivityStatement } from "../../apiclient/backend/api";
import { useTheme } from "@mui/system";
import PlotlyChart from "./PlotlyChart";
import Recharts from "./Recharts";

const StatementChart = (props: { statement: ConnectivityStatement }) => {
  const { statement } = props;
  const theme = useTheme();

  const displayChart =
    statement.origin && statement.destination && statement.path.length > 0;

  return (
    <Box
      display="flex"
      justifyContent="center"
      sx={{ background: theme.palette.grey[100], borderRadius: 1 }}
    >
      {displayChart ? (
        <Box display="flex" flexDirection="column">
          <Recharts statement={statement} />
          <PlotlyChart statement={statement} />
        </Box>
      ) : (
        <Box p={3}>
          <Typography>
            Add Origin, Destination and Via entities to visualize the statement
            preview
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default StatementChart;
