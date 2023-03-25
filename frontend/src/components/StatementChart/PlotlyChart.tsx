import React from "react";
import Plot from "react-plotly.js";
import { ConnectivityStatement, Via } from "../../apiclient/backend";
import { useTheme } from "@mui/system";
import { Box } from "@mui/material";

const axis_config = {
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
  xaxis2: { ...axis_config, domain: [0.2, 0.8] },
  showlegend: false,
  plot_bgcolor: "transparent",
  paper_bgcolor: "transparent",
  xaxis: axis_config,
  yaxis: axis_config,
  margin: margins_config,
  annotations: [{}],
  hoverlabel: { bgcolor: "#fff" },
};

const truncateString = (text: string, numberOfChars: number) => {
  if (text.length >= numberOfChars)
    return text.slice(0, numberOfChars) + " ...";
  return text;
};

const styledLabels = (text: string) => {
  let splitText = text.split(" ");
  if (splitText.length > 4) {
    splitText = splitText.slice(0, 5);
    splitText[4] = splitText[4] + " ...";
  }
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
    x: i,
    y: 1,
    text: via && truncateString(via.anatomical_entity.name, 20),
    font: { size: 12 },
    showarrow: false,
    textangle: -45,
    yanchor: "bottom",
    xanchor: "left",
    xref: "x2",
  }));

function PlotlyChart(props: { statement: ConnectivityStatement }) {
  const { statement } = props;
  const theme = useTheme();

  layout.annotations = generateAnnotations(statement.path);

  const data = [
    {
      name: "Via",
      x: [0, ...statement.path.map((v, i) => i + 1)],
      y: [1, ...statement.path.map(() => 1)],
      type: "scatter",
      mode: "lines+markers",
      text: [...statement.path.map((v) => v.anatomical_entity.name), ""],
      line: { color: "#98A2B3", width: 1 },
      marker: { symbol: "arrow", angleref: "previous", size: 10 },
      xaxis: "x2",
      hovertemplate: "%{text}<extra></extra>",
    },
    {
      x: [0, statement.path.length],
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
  return (
    <Box width="100%" display="flex" justifyContent="center">
      <Plot
        data={data}
        layout={layout}
        config={{ displaylogo: false }}
        style={{ height: "100%", width: "100%" }}
        useResizeHandler
      />
    </Box>
  );
}

export default PlotlyChart;
