import React from "react";
import Plot from "react-plotly.js";
import { ConnectivityStatement, Via } from "../../apiclient/backend";
import { chartHeight, chartWidth } from "../../helpers/settings";
import { useTheme } from "@mui/system";
import { Box } from "@mui/material";

const axes_config = {
  showgrid: false,
  zeroline: false,
  showline: false,
  showticklabels: false,
};

const margins_config = {
  l: 0, //left margin
  r: 0, //right margin
};
const layout = {
  autosize: true,
  //width: chartWidth,
  //height: chartHeight,
  showlegend: false,
  plot_bgcolor: "transparent",
  paper_bgcolor: "transparent",
  xaxis: axes_config,
  yaxis: axes_config,
  margin: margins_config,
  annotations: [{}],
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

const generateAnnotations = (path: (Via | null)[]) =>
  path.map((via, i) => ({
    x: i + 1,
    y: 1,
    text: via?.anatomical_entity.name,
    showarrow: false,
    textangle: -45,
    yanchor: "bottom",
    xanchor: "left",
  }));

function PlotlyChart(props: { statement: ConnectivityStatement }) {
  const { statement } = props;
  const theme = useTheme();

  layout.annotations = generateAnnotations(statement.path);

  const data = [
    {
      name: "Via",
      x: [0, ...statement.path.map((v, i) => i + 1), statement.path.length + 1],
      y: [1, ...statement.path.map(() => 1), 1],
      type: "scatter",
      mode: "lines+markers",
      text: ["", ...statement.path.map((v) => v.anatomical_entity.name), ""],
      textposition: "top",
      line: { color: "#98A2B3", width: 1 },
      marker: { symbol: "arrow", angleref: "previous", size: 10 },
      hoverinfo: "skip",
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
      marker: {
        color: theme.palette.common.white,
        size: 100,
        line: { color: "#D0D5DD", width: 1 },
      },
      hoverinfo: "skip",
    },
  ];
  return <Box flexGrow={1}><Plot useResizeHandler style={{height:'100%', width:'100%'}} data={data} layout={layout} config={{ displaylogo: false }} /></Box>;
}

export default PlotlyChart;
