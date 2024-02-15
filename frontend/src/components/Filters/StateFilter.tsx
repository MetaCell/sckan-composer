import React from "react"
import { Stack, Typography } from "@mui/material"
import ControlledCheckbox from "../Widgets/ControlledCheckbox"
import {SentenceLabels} from "../../helpers/helpers";

const sentenceLabels = {...SentenceLabels}
const statementLabels = {}

const StateFilter = (props: any) => {
  const { selectedStates, setSelectedStates, entity } = props

  const generateDataForCheckbox = (e: any) => {
    let mappedItems: any[] = []
    let i: keyof typeof selectedStates
    for (i in selectedStates) {
      const item = {
        name: i,
        label: selectedStates[i],
        checked: selectedStates[i],
      }
      mappedItems.push(item)
    }
    return mappedItems
  }

  const statesData = generateDataForCheckbox(
    entity === "sentence" ? sentenceLabels : statementLabels
  )

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedStates((prev: any) => ({
      ...prev,
      [event.target.name]: event.target.checked,
    }))
  }

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle1" color="#344054">
        Status
      </Typography>
      <ControlledCheckbox
        data={statesData}
        handleChange={handleChange}
        type="state"
        entity={entity}
      />
    </Stack>
  )
}

export default StateFilter
