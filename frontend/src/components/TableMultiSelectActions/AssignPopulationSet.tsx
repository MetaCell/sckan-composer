import React, { useState } from "react";
import PopoverMenu from "./PopoverMenu";
import { AssignPopulationIcon } from "../icons";

const AssignPopulationSet = () => {
  const [selectedSet, setSelectedSet] = useState<string | null>(null);
  
  const populationSets = ["mmset1", "mmset2", "mmset3", "mmset4", "brain", "vagus", "keast", "liver", "mmset6"];
  
  const handleSelectSet = (set: string) => {
    setSelectedSet(set);
    console.log(`Assigned population set: ${set}`);
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
