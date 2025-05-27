import IconButton from "@mui/material/IconButton";
import { LabelAddIcon } from "../icons";
import CustomSearchSelect from "./CustomSearchSelect";
import React, { useEffect, useState } from "react";
import Tooltip from "@mui/material/Tooltip";
import sentenceService from "../../services/SentenceService";
import { QueryParams as SentenceQueryParams } from "../../redux/sentenceSlice";
import { QueryParams as StatementQueryParams } from "../../redux/statementSlice";
import { ENTITY_TYPES } from "../../helpers/settings";
import { Tag } from "../../apiclient/backend";
import { tags as tagService } from "../../services/TagService";
import { OptionType } from "../../types";
import connectivityStatementService from "../../services/StatementService";

const mapTagsToSelectOptions = (tags: Tag[]): OptionType[] => {
  return tags.map((tag) => ({
    id: tag.id,
    label: tag.tag,
  }));
};

interface ManageTagsProps {
  tagsStatus: any;
  entityType: ENTITY_TYPES;
  queryOptions: SentenceQueryParams | StatementQueryParams;
  onClick: () => void;
  onConfirm: () => void;
  isFetchingOptions: boolean;
}

const ManageTags: React.FC<ManageTagsProps> = ({
  tagsStatus,
  entityType,
  queryOptions,
  onConfirm,
  onClick,
  isFetchingOptions,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState<OptionType[]>([]);
  const [tagsList, setTagsList] = useState<Tag[]>([]);
  const [tagsInAllRows, setTagsInAllRows] = useState<string[]>([]);
  const [tagsInSomeRows, setTagsInSomeRows] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [unselectedTags, setUnselectedTags] = useState<OptionType[]>([]);
  const [addedTags, setAddedTags] = useState<OptionType[]>([]);
  
  // Update the tagManagementMap so it now accepts two arrays.
  const tagManagementMap: Record<
    ENTITY_TYPES,
    (
      queryOptions: SentenceQueryParams | StatementQueryParams,
      addTagIds: number[],
      removeTagIds: number[]
    ) => Promise<{ message: string }>
  > = {
    [ENTITY_TYPES.SENTENCE]: (queryOptions, addTagIds, removeTagIds) =>
      sentenceService.assignTagBulk(queryOptions as SentenceQueryParams, addTagIds, removeTagIds),
    [ENTITY_TYPES.STATEMENT]: (queryOptions, addTagIds, removeTagIds) =>
      connectivityStatementService.assignTagBulk(queryOptions as StatementQueryParams, addTagIds, removeTagIds),
  };

  useEffect(() => {
    const fetchTags = async () => {
      const fetchedTags = await tagService.getTagList();
      setTagsList(fetchedTags);
    };

    fetchTags();
  }, []);

  // When tagsStatus or tagsList change, set the initial selected tags.
  useEffect(() => {
    if (tagsStatus && tagsList.length) {
      const initialAllRows = tagsStatus?.used_by_all?.map((row: any) => row.tag);
      const initialSomeRows = tagsStatus?.used_by_some?.map((row: any) => row.tag);
      const initialOptions = mapTagsToSelectOptions(tagsList).filter((tag: OptionType) =>
        initialAllRows?.includes(tag.label) || initialSomeRows?.includes(tag.label)
      );
      setTagsInAllRows(initialAllRows);
      setTagsInSomeRows(initialSomeRows);
      setSelectedTags(initialOptions);
    }
  }, [tagsStatus, tagsList]);

  const handleClose = () => {
    setAnchorEl(null);
    setSearchTerm("");
  };
  
  const handleSelectTag = (tag: OptionType) => {
    setSelectedTags((prevSelected: OptionType[]) => {
      const isAlreadySelected = prevSelected.some((row) => row.id === tag.id);
      if (isAlreadySelected) {
        setUnselectedTags((prevUnselected) => [...prevUnselected, tag]);
        setAddedTags((prevAdded) => prevAdded.filter((row) => row.id !== tag.id));
        return prevSelected.filter((row) => row.id !== tag.id);
      } else {
        setUnselectedTags((prevUnselected) => prevUnselected.filter((row) => row.id !== tag.id));
        setAddedTags((prevSelected) => [...prevSelected, tag])
        return [...prevSelected, tag];
      }
    });
    
    setTagsInAllRows((prevSelected: string[]) =>
      prevSelected.includes(tag.label) ? prevSelected.filter((row) => row !== tag.label) : prevSelected
    );
    
    setTagsInSomeRows((prevSelected: string[]) =>
      prevSelected.includes(tag.label) ? prevSelected.filter((row) => row !== tag.label) : prevSelected
    );
  };
  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      const addTagIds = addedTags.map((tag) => tag.id);
      const removeTagIds = unselectedTags.map((tag) => tag.id);

      const tagAssignmentFunction = tagManagementMap[entityType as ENTITY_TYPES];
      if (!tagAssignmentFunction)
        throw new Error(`No function found for ${entityType}`);

      await tagAssignmentFunction(queryOptions, addTagIds, removeTagIds);
    } catch (error) {
      console.error("Error updating tags:", error);
    } finally {
      setIsLoading(false);
      setUnselectedTags([])
      setAddedTags([])
      onConfirm();
    }
    handleClose();
  };
  const handleViewTagsMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    onClick();
  };

  return (
    <>
      <Tooltip arrow title={"Manage tag(s)"}>
        <IconButton onClick={handleViewTagsMenu} disabled={isLoading}>
          <LabelAddIcon />
        </IconButton>
      </Tooltip>

      <CustomSearchSelect
        open={Boolean(anchorEl)}
        handleClose={handleClose}
        anchorEl={anchorEl}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        data={mapTagsToSelectOptions(tagsList)}
        selectedOptions={selectedTags.map((tag: OptionType) => tag.label)}
        onOptionSelect={handleSelectTag}
        placeholder="Search for tag"
        confirmButtonText={isLoading ? "Applying..." : "Apply"}
        onConfirm={handleConfirm}
        onCancel={handleClose}
        variant="checkbox"
        optionsInAllRows={tagsInAllRows}
        optionsInSomeRows={tagsInSomeRows}
        isFetchingOptions={isFetchingOptions}
      />
    </>
  );
};

export default ManageTags;
