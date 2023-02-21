import React from "react"
import Chip from "@mui/material/Chip"
import { statementStateToColor, sentenceStateToColor } from "../../helpers/settings"
import { snakeToSpace, StateColor } from "../../helpers/helpers"

const renderState = (state: string, colorStates: any) => {
  const i: keyof typeof colorStates = state
  const color: StateColor = colorStates[i]
  const label: string = snakeToSpace(state)
  return <Chip variant="filled" size="small" color={color} label={label} />
}

export const SentenceStateChip = (props: {value: string}) => {
  return renderState(props.value, sentenceStateToColor)
}

export const StatementStateChip = (props: {value: string}) => {
  return renderState(props.value, statementStateToColor)
}
