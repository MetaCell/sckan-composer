import React, { useState } from "react";
import PopoverMenu from "./PopoverMenu";
import { AssignPopulationIcon } from "../icons";
import { populations as PopulationService } from "../../services/PopulationService";
import { ENTITY_TYPES } from "../../helpers/settings";
import sentenceService from "../../services/SentenceService";
import connectivityStatementService from "../../services/StatementService";
import { QueryParams as SentenceQueryParams } from "../../redux/sentenceSlice";
import { QueryParams as StatementQueryParams } from "../../redux/statementSlice";
import { PopoverOptionType } from "../../types";

interface AssignPopulationSetProps {
  selectedTableRows: any[];
  entityType: ENTITY_TYPES;
  queryOptions: SentenceQueryParams | StatementQueryParams;
}

const AssignPopulationSet: React.FC<AssignPopulationSetProps> = ({
  entityType,
  queryOptions,
}) => {
  const [selectedSet, setSelectedSet] = useState<PopoverOptionType | null>(null);

  const populationSets: PopoverOptionType[] = PopulationService.getPopulations().map((popSet) => ({
    label: popSet.name,
    value: popSet.id.toString(),
  }));


  const assignPopulationSetMap: Record<
    ENTITY_TYPES,
    (
      queryOptions: SentenceQueryParams | StatementQueryParams,
      selectedSet: number
    ) => Promise<{ message: string }>
  > = {
    [ENTITY_TYPES.SENTENCE]: (queryOptions, selectedSet) =>
      sentenceService.assignPopulationSetBulk(
        queryOptions as SentenceQueryParams,
        selectedSet
      ),
    [ENTITY_TYPES.STATEMENT]: (queryOptions, selectedSet) =>
      connectivityStatementService.assignPopulationSetBulk(
        queryOptions as StatementQueryParams,
        selectedSet
      ),
  };

  const handleSelectSet = async (selectedOption: PopoverOptionType) => {
    const parsedSetId = parseInt(selectedOption.value, 10);
    if (isNaN(parsedSetId)) {
      console.error("Invalid population set ID:", selectedOption.value);
      return;
    }

    setSelectedSet(selectedOption);

    try {
      const assignPopulationFunction = assignPopulationSetMap[entityType];
      if (!assignPopulationFunction) throw new Error(`No function found for ${entityType}`);

      await assignPopulationFunction(queryOptions, parsedSetId);
    } catch (error) {
      console.error("Error assigning population set:", error);
    }
  };

  return (
    <PopoverMenu
      icon={AssignPopulationIcon}
      tooltip="Assign population set"
      options={populationSets}
      selectedOption={selectedSet}
      onSelect={handleSelectSet}
      onOpen={() => { }}
      noOptionsText={"No options available!"}
    />
  );
};

export default AssignPopulationSet;
