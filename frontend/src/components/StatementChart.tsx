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
import SvgIcon from "@mui/material/SvgIcon";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Typography from "@mui/material/Typography";
import { ConnectivityStatement } from "../apiclient/backend/api";
import { chartHeight, chartWidth } from "../helpers/settings";

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

const StatementChart = (props: { statement: ConnectivityStatement }) => {
  const { statement } = props;
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

  return displayChart ? (
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
          <LabelList dataKey="label" position="center" />
        </Line>
        <Line type="monotone" dataKey="via" stroke="#98A2B3" dot={ArrowDot}>
          <LabelList dataKey="label" position="insideBottomLeft" offset={20} />
        </Line>
      </LineChart>
    </ResponsiveContainer>
  ) : (
    <Typography>
      Add Origin, Destination and Via entities to visualize the statement
      preview
    </Typography>
  );
};

export default StatementChart;
