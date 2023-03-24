import React from "react";
import {
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import SvgIcon from "@mui/material/SvgIcon";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { ConnectivityStatement } from "../../apiclient/backend/api";
import { chartHeight, chartWidth } from "../../helpers/settings";

const ArrowDot = (props: any) => {
  const { cx, cy, stroke, payload, key } = props;

  if (payload.noDot) {
    return <></>;
  }

  return (
    <SvgIcon
      key={key}
      stroke={stroke}
      x={cx - 10}
      y={cy - 10}
      width={20}
      height={20}
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
          key={index}
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

const Recharts = (props: { statement: ConnectivityStatement }) => {
  const { statement } = props;

  const generateVias = () => {
    const vias: any[] = [];
    if (statement.path.length === 0) {
      return vias;
    }
    vias.push({ noDot: true });
    for (const v of statement.path) {
      vias.push(
        { noDot: true },
        {
          noDot: true,
          via: 1,
          viaLabel: v.anatomical_entity.name,
        },
        { noDot: true, via: 1 },
        { via: 1, noDot: true },
        { via: 1, noDot: true },
        { via: 1, noDot: true },
        { via: 1, noDot: true },
        { via: 1 }
      );
    }
    vias.push({ noDot: true });
    return vias;
  };

  const vias = generateVias();

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
    <ResponsiveContainer height={chartHeight}>
      <LineChart data={data} margin={{ right: 76, left: 76 }}>
        <YAxis hide domain={[0, 2]} />
        <XAxis hide />
        <Line
          key="node"
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
        <Line
          key="via"
          type="monotone"
          dataKey="via"
          stroke="#98A2B3"
          dot={ArrowDot}
        >
          <LabelList
            dataKey="viaLabel"
            position="insideBottomLeft"
            offset={8}
          />
        </Line>
      </LineChart>
    </ResponsiveContainer>
  );
};

export default Recharts;
