import React, { useState } from "react";
import PopoverMenu from "./PopoverMenu";
import { AssignPopulationIcon } from "../icons";

const AssignPopulationSet = ({selectedTableRows, entityType}: any) => {
  const [selectedSet, setSelectedSet] = useState<string | null>(null);
  
  const populationSets = ["mmset1", "mmset2", "mmset3", "mmset4", "brain", "vagus", "keast", "liver", "mmset6"];
  
  const handleSelectSet = (set: string) => {
    setSelectedSet(set);
    // TODO: API call to assign population set
    console.log(`Assigned population set:`, set, entityType, selectedTableRows);
  };
  
  return (
    <PopoverMenu
      icon={AssignPopulationIcon}
      tooltip="Assign population set"
      options={populationSets}
      selectedOption={selectedSet}
      onSelect={handleSelectSet}
    />
  );
};

export default AssignPopulationSet;
