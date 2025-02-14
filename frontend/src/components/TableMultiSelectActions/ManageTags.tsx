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

const mapTagsToSelectOptions = (tags: Tag[]) => {
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
  isFetchingOptions: boolean
}

const ManageTags: React.FC<ManageTagsProps> = ({ tagsStatus, entityType, queryOptions, onConfirm, onClick, isFetchingOptions }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState<OptionType[]>([]);
  const [tagsList, setTagsList] = useState<Tag[]>([]);
  const [tagsInAllRows, setTagsInAllRows] = useState<string[]>([]);
  const [tagsInSomeRows, setTagsInSomeRows] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const tagManagementMap: Record<
    ENTITY_TYPES,
    (queryOptions: SentenceQueryParams | StatementQueryParams, tagIds: number[]) => Promise<{ message: string }>
  > = {
    [ENTITY_TYPES.SENTENCE]: (queryOptions, tagIds) =>
      sentenceService.assignTagBulk(queryOptions as SentenceQueryParams, tagIds),
    [ENTITY_TYPES.STATEMENT]: (queryOptions, tagIds) =>
      connectivityStatementService.assignTagBulk(queryOptions as StatementQueryParams, tagIds)
  };


  useEffect(() => {
    const fetchTags = async () => {
      const fetchedTags = await tagService.getTagList();
      setTagsList(fetchedTags);
    };

    fetchTags();
  }, []);
  const handleClose = () => {
    setAnchorEl(null);
    setSearchTerm("");
  };

  const handleSelectTag = (tag: OptionType) => {
    setSelectedTags((prevSelected: OptionType[]) => {
      const isAlreadySelected = prevSelected.some((row) => row.id === tag.id);
      return isAlreadySelected ? prevSelected.filter((row) => row.id !== tag.id) : [...prevSelected, tag];
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
      const tagAssignmentFunction = tagManagementMap[entityType as ENTITY_TYPES];
      if (!tagAssignmentFunction) throw new Error(`No function found for ${entityType}`);

      const tagIds = selectedTags.map((tag) => tag.id);
      await tagAssignmentFunction(queryOptions, tagIds);

    } catch (error) {
      console.error("Error updating tags:", error);
    } finally {
      setIsLoading(false);
      onConfirm();
    }

    handleClose();
  };

  const handleViewTagsMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    onClick()
  };
  
  useEffect(() => {
    if (tagsStatus) {
      const initialTagsInAllRows = tagsStatus?.used_by_all?.map((row: any) => row.tag)
      const initialTagsInSomeRows = tagsStatus?.used_by_some?.map((row: any) => row.tag)
      const initialSelectedTags = mapTagsToSelectOptions(tagsList)?.filter((tag: OptionType) =>
        initialTagsInAllRows?.includes(tag?.label) || initialTagsInSomeRows?.includes(tag?.label)
      );
      
      setTagsInAllRows(initialTagsInAllRows);
      setTagsInSomeRows(initialTagsInSomeRows);
      setSelectedTags(initialSelectedTags)
    }
  }, [tagsStatus, tagsList])

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
