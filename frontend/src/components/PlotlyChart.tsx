import React, { useState } from "react";
import Plot from "react-plotly.js";
import { ConnectivityStatement } from "../apiclient/backend";
import { chartHeight, chartWidth } from "../helpers/settings";
import { Box } from "@mui/material";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/system";

const axes_config = {
  showgrid: false,
  zeroline: false,
  showline: false,
  showticklabels: false,
};

const margins_config = {
  l: 0, //left margin
  r: 0, //right <margin></margin>
};
const layout = {
  autosize: false,
  width: chartWidth,
  height: chartHeight,
  showlegend: false,
  plot_bgcolor: "transparent",
  paper_bgcolor: "transparent",
  xaxis: axes_config,
  yaxis: axes_config,
  margin: margins_config,
  // annotations: [{
  //     x:2,
  //     y:2,
  //     xref:"x",
  //     yref:"y",
  //     text:"",
  //     showarrow:true,
  //     }]
};

function PlotlyCharts(props: { statement: ConnectivityStatement }) {
  const { statement } = props;
  const theme = useTheme();

  const extremesMarker = {
    color: theme.palette.common.white,
    size: 100,
    line: { color: "#D0D5DD", width: 1 },
  };
  const viaMarker = {
    symbol: "arrow",
    angleref: "previous",
    size: 10,
  };

  const styledLabels = (text: string) => {
    const splitText = text.split(" ");
    const formattedTextArray = splitText.map(
      (word) => `<span style="
      font-weight: 600;
      font-size: 14px;
      font-family:Inter, sans-serif;
      color: #344054;
  ">${word}</span><br>`
    );
    const formattedText = formattedTextArray.join("").slice(0, -4);
    return formattedText;
  };

  const data = [
    {
      x: [0, ...statement.path.map((v, i) => i + 1), statement.path.length + 1],
      y: [1, ...statement.path.map(() => 1), 1],
      type: "scatter",
      mode: "lines+markers",
      text: ["", ...statement.path.map((v) => v.anatomical_entity.name), ""],
      textposition: "top",
      line: { color: "#98A2B3", width: 1 },
      marker: { symbol: "arrow", angleref: "previous", size: 10 },
    },
    {
      x: [0, statement.path.length + 1],
      y: [1, 1],
      type: "scatter",
      mode: "markers+text",
      text: [
        styledLabels(statement.origin?.name),
        styledLabels(statement.destination?.name),
      ],
      textfont: {
        size: 14,
        weight: 600,
        family: "Inter Bold, sans-serif, ",
      },
      marker: {
        color: theme.palette.common.white,
        size: 100,
        line: { color: "#D0D5DD", width: 1 },
      },
    },
  ];
  return <Plot data={data} layout={layout} config={{ displaylogo: false }} />;
}

export default PlotlyCharts;
