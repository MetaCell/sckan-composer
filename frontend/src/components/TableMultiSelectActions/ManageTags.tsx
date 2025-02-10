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

const mapTagsToSelectOptions = (tags: Tag[]) => {
  return tags.map((tag) => ({
    id: tag.id,
    label: tag.tag,
  }));
};

interface ManageTagsProps {
  selectedTableRows: any[];
  entityType: ENTITY_TYPES;
  queryOptions: SentenceQueryParams | StatementQueryParams;
  onConfirm: () => void;
}

const ManageTags: React.FC<ManageTagsProps> = ({ selectedTableRows, entityType, queryOptions, onConfirm }) => {
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
    [ENTITY_TYPES.STATEMENT]: async () => {
      return new Promise((resolve) =>
        setTimeout(() => resolve({ message: "Mocked statement tag assignment." }), 500)
      );
    },
  };


  useEffect(() => {
    const fetchTags = async () => {
      const fetchedTags = await tagService.getTagList();
      setTagsList(fetchedTags);
    };

    fetchTags();
  }, []);

  useEffect(() => {
    const allTags: string[][] = selectedTableRows.map((row: any) => row.tags as string[]);
    const uniqueTags: string[] = [...new Set(allTags.flat())];

    const tagsInAllRows: string[] = uniqueTags.filter((tag: string) =>
      selectedTableRows.every((row: any) => row.tags.includes(tag))
    );

    const tagsInSomeRows: string[] = uniqueTags.filter(
      (tag: string) =>
        selectedTableRows.some((row: any) => row.tags.includes(tag)) && !tagsInAllRows.includes(tag)
    );

    const initialSelectedTags = mapTagsToSelectOptions(tagsList).filter((tag: OptionType) =>
      tagsInAllRows.includes(tag.label) || tagsInSomeRows.includes(tag.label)
    );

    setSelectedTags(initialSelectedTags);
    setTagsInSomeRows(tagsInSomeRows);
    setTagsInAllRows(tagsInAllRows);
  }, [selectedTableRows, tagsList]);

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
        variant="checkbox"
        optionsInAllRows={tagsInAllRows}
        optionsInSomeRows={tagsInSomeRows}
      />
    </>
  );
};

export default ManageTags;
