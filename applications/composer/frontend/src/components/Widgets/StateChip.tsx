import React from "react"
import Chip from "@mui/material/Chip"
import {statementStateToColor, sentenceStateToColor} from "../../helpers/settings"
import {snakeToSpace, StateColor} from "../../helpers/helpers"
import {ComposerConnectivityStatementListStateEnum, SentenceAvailableTransitionsEnum} from "../../apiclient/backend";


type CombinedStateEnum =
  typeof SentenceAvailableTransitionsEnum[keyof typeof SentenceAvailableTransitionsEnum]
  | typeof ComposerConnectivityStatementListStateEnum[keyof typeof ComposerConnectivityStatementListStateEnum];

const stateLabels: Partial<Record<CombinedStateEnum, string>> = {
  npo_approved: 'NPO Approved',
};

const renderState = (state: string, colorStates: any) => {
  const i: keyof typeof colorStates = state.replaceAll(" ", "_")
  const color: StateColor = colorStates[i]
  const stateCast = state as CombinedStateEnum
  const label: string = stateLabels[stateCast] || snakeToSpace(state);
  return <Chip variant="filled" size="small" color={color} label={label}/>
}

export const SentenceStateChip = (props: { value: string }) => {
  return renderState(props.value, sentenceStateToColor)
}

export const StatementStateChip = (props: { value: string }) => {
  return renderState(props.value, statementStateToColor)
}
