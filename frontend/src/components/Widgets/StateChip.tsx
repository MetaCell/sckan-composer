import React from "react";
import Chip from "@mui/material/Chip";
import { stateToColor } from "../../helpers/settings";
import { snakeToSpace } from "../../helpers/helpers";

const StateChip = (props: { value: any }) => {
  let i: keyof typeof stateToColor;
  i = props.value;
  const color = stateToColor[i];
  const label = snakeToSpace(props.value);
  return <Chip variant="filled" size="small" color={color} label={label} />;
};

export default StateChip;
