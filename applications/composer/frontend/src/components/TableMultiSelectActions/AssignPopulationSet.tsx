import React, { useState } from "react";
import {AssignPopulationIcon} from "../icons";
import { populations as PopulationService } from "../../services/PopulationService";
import { ENTITY_TYPES } from "../../helpers/settings";
import sentenceService from "../../services/SentenceService";
import connectivityStatementService from "../../services/StatementService";
import { QueryParams as SentenceQueryParams } from "../../redux/sentenceSlice";
import { QueryParams as StatementQueryParams } from "../../redux/statementSlice";
import {OptionType, PopoverOptionType} from "../../types";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import CustomSearchSelect from "./CustomSearchSelect";

interface AssignPopulationSetProps {
  entityType: ENTITY_TYPES;
  queryOptions: SentenceQueryParams | StatementQueryParams;
  onClick: () => void;
  isFetchingOptions: boolean;
  onConfirm: () => void;
}

interface populationSetType extends OptionType {
  value?: string;
}
const mapSetsToSelectOptions = (sets: PopoverOptionType[]) => {
  return sets.map((set: PopoverOptionType, id: number) => ({
    id: id,
    label: set.label,
    value: set.value,
  }));
};
const AssignPopulationSet: React.FC<AssignPopulationSetProps> = ({
  entityType,
  queryOptions,
  onClick,
  isFetchingOptions,
  onConfirm
}) => {
  const [selectedSet, setSelectedSet] = useState<populationSetType | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const populationSets: PopoverOptionType[] = PopulationService.getPopulations().map((popSet) => ({
    label: popSet.name,
    value: popSet.id.toString(),
  }));
  
  const handleSelectSet = (set: populationSetType) => {
    setSelectedSet(set);
  };

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
  const handleConfirm = async () => {
    const parsedSetId = parseInt(selectedSet?.value as string, 10);
    if (isNaN(parsedSetId)) {
      console.error("Invalid population set ID:", selectedSet?.value);
      return;
    }
    setIsLoading(true);
    setSelectedSet(selectedSet);

    try {
      const assignPopulationFunction = assignPopulationSetMap[entityType];
      if (!assignPopulationFunction) throw new Error(`No function found for ${entityType}`);

      await assignPopulationFunction(queryOptions, parsedSetId);
    } catch (error) {
      console.error("Error assigning population set:", error);
    } finally {
      onConfirm();
      setIsLoading(false);
      handleClose();
    }
  };
  
  const handleViewSetsMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    onClick();
  };
  
  const handleClose = () => {
    setAnchorEl(null);
    setSearchTerm("");
    setSelectedSet(null);
  };
  
  return (
    <>
      <Tooltip arrow title={"Assign population set"}>
        <IconButton onClick={handleViewSetsMenu}>
          <AssignPopulationIcon />
        </IconButton>
      </Tooltip>
      
      <CustomSearchSelect
        open={Boolean(anchorEl)}
        handleClose={handleClose}
        anchorEl={anchorEl}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        data={mapSetsToSelectOptions(populationSets)}
        selectedOptions={selectedSet ? [selectedSet?.label] : []} // Only 1 selection
        onOptionSelect={handleSelectSet}
        placeholder="Search for sets"
        confirmButtonText={isLoading ? "Assigning..." : "Assign"}
        onConfirm={handleConfirm}
        onCancel={handleClose}
        showHelperText={false}
        isFetchingOptions={isFetchingOptions}
      />
    </>
  );
};

export default AssignPopulationSet;
