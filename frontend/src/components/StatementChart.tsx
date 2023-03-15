import React, { useEffect, useState } from "react";
import {
  Label,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { Box } from "@mui/material";
import SvgIcon from "@mui/material/SvgIcon";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Typography from "@mui/material/Typography";
import { ConnectivityStatement } from "../apiclient/backend/api";
import { chartHeight, chartWidth } from "../helpers/settings";
import { useTheme } from "@mui/system";

const ArrowDot = (props: any) => {
  const { cx, cy, stroke, payload, value } = props;

  if (payload.noDot) {
    return <></>;
  }

  return (
    <SvgIcon
      stroke={stroke}
      x={cx - 10}
      y={cy - 10}
      width={20}
      height={20}
      fill="red"
      viewBox="0 0 1024 1024"
    >
      <ChevronRightIcon />
    </SvgIcon>
  );
};

const NodeLabel = (props: any) => {
  const { x, y, stroke, value } = props;
  const splitValue = value?.split(" ");
  const yDrift = 8;
  const initialY = y - yDrift * (splitValue?.length - 1);
  return (
    <>
      {splitValue?.map((label: string, index: number) => (
        <text
          x={x}
          y={initialY + index * 20}
          fill="#344054"
          fontSize={14}
          fontWeight={600}
          textAnchor="middle"
        >
          {label}
        </text>
      ))}
    </>
  );
};

const StatementChart = (props: { statement: ConnectivityStatement }) => {
  const { statement } = props;
  const theme = useTheme();
  const [vias, setVias] = useState<any[]>([]);
  const displayChart =
    statement.origin && statement.destination && statement.path.length > 0;

  const generateVias = () => {
    const vias: any[] = [];
    if (statement.path.length === 0) {
      return vias;
    }
    for (const v of statement.path) {
      vias.push(
        { noDot: true },
        {
          noDot: true,
          via: 1,
          label: v.anatomical_entity.name,
        },
        { noDot: true, via: 1 },
        { via: 1 }
      );
    }
    return vias;
  };

  useEffect(() => {
    displayChart && setVias(generateVias());
  }, []);

  const data = [
    {
      label: statement.origin?.name,
      node: 1,
      noDot: true,
    },
    ...vias,
    { noDot: true },
    {
      name: "Destination",
      label: statement.destination?.name,
      node: 1,
      noDot: true,
    },
  ];

  return (
    <Box
      display="flex"
      justifyContent="center"
      sx={{ background: theme.palette.grey[100], borderRadius: 1 }}
    >
      {displayChart ? (
        <ResponsiveContainer width={chartWidth} height={chartHeight}>
          <LineChart data={data} margin={{ right: 76, left: 76 }}>
            <YAxis hide domain={[0, 2]} />
            <XAxis hide />
            <Line
              type="monotone"
              dataKey="node"
              stroke="#98A2B3"
              dot={{ r: 50, stroke: "#D0D5DD", strokeWidth: 1 }}
            >
              <LabelList
                dataKey="label"
                position="center"
                content={<NodeLabel />}
              />
            </Line>
            <Line type="monotone" dataKey="via" stroke="#98A2B3" dot={ArrowDot}>
              <LabelList
                dataKey="label"
                position="insideBottomLeft"
                offset={20}
              />
            </Line>
          </LineChart>
        </ResponsiveContainer>
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
