import React from "react";
import { Stack, Typography } from "@mui/material";
import ControlledCheckbox from "../Widgets/ControlledCheckbox";
import { SentenceAvailableTransitionsEnum as sentenceStates } from "../../apiclient/backend";

const sentenceLabels = {
  [sentenceStates.Open]: "Open",
  [sentenceStates.ToBeReviewed]: "To be reviewed",
  [sentenceStates.ComposeLater]: "Compose later",
  [sentenceStates.ComposeNow]: "Compose now",
  [sentenceStates.Duplicate]: "Duplicate",
  [sentenceStates.Excluded]: "Excluded",
};

const statementLabels = {};

const StateFilter = (props: any) => {
  const { selectedStates, setSelectedStates, entity } = props;

  const generateDataForCheckbox = (labels: any) => {
    let mappedItems: any[] = [];
    let i: keyof typeof selectedStates;
    for (i in selectedStates) {
      const item = {
        name: i,
        label: labels[i],
        checked: selectedStates[i],
      };
      mappedItems.push(item);
    }
    return mappedItems;
  };

  const statesData = generateDataForCheckbox(
    entity === "sentence" ? sentenceLabels : statementLabels
  );

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedStates((prev: any) => ({
      ...prev,
      [event.target.name]: event.target.checked,
    }));
  };

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle1" color="#344054">
        Status
      </Typography>
      <ControlledCheckbox
        data={statesData}
        handleChange={handleChange}
        type="state"
      />
    </Stack>
  );
};

export default StateFilter;
