import IconButton from "@mui/material/IconButton";
import {LabelAddIcon} from "../icons";
import CustomSearchSelect from "./CustomSearchSelect";
import React, {useEffect, useState} from "react";
import Tooltip from "@mui/material/Tooltip";
import {tags} from "../../services/TagService";
import {Tag} from "../../apiclient/backend";
import {OptionType} from "./AssignUser";

const mapTagsToSelectOptions = (tags: Tag[]) => {
  return tags.map((tag) => ({
    id: tag.id,
    label: tag.tag,
  }));
}
const ManageTags = ({selectedTableRows}: any) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTags, setSelectedTags] = useState<OptionType[]>([])
  const [tagsList, setTagsList] = useState<Tag[]>([])
  const [tagsInAllRows, setTagsInAllRows] = useState<string[]>([]);
  const [tagsInSomeRows, setTagsInSomeRows] = useState<string[]>([]);
  const handleClose = () => {
    setAnchorEl(null)
    setSearchTerm("")
  }
  
  const handleSelectTag = (tag: OptionType) => {
    setSelectedTags((prevSelected: OptionType[]) => {
      const isAlreadySelected = prevSelected.some((row) => row.id === tag.id)
      if (isAlreadySelected) {
        return prevSelected.filter((row) => row.id !== tag.id)
      } else {
        return [...prevSelected, tag]
      }
    })
    
    // If the tag exists in tagsInAllRows, remove it
    setTagsInAllRows((prevSelected: string[]) =>
      prevSelected.includes(tag.label) ? prevSelected.filter((row) => row !== tag.label) : prevSelected
    );
    
    // If the tag exists in tagsInSomeRows, remove it
    setTagsInSomeRows((prevSelected: string[]) =>
      prevSelected.includes(tag.label) ? prevSelected.filter((row) => row !== tag.label) : prevSelected
    );
  }
  
  const handleConfirm = () => {
    // TODO: API call to Assign selected tags to the selected entities
    console.log("Confirmed selections:", selectedTags)
    handleClose()
  }
  const handleViewTagsMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  useEffect(() => {
    const tagsList = tags.getTagList();
    setTagsList(tagsList);
  }, []);
  
  useEffect(() => {
    // Get all unique tags from selectedTableRows
    const allTags: string[][] = selectedTableRows.map((row: any) => row.tags as string[]); // Ensure it's an array of strings
    const uniqueTags: string[] = [...new Set(allTags.flat())]; // Explicitly cast to string[]
    
    // Find tags that are in all rows
    const tagsInAllRows: string[] = uniqueTags.filter((tag: string) =>
      selectedTableRows.every((row: any) => row.tags.includes(tag))
    );
    
    // Find tags that are in some but not all rows
    const tagsInSomeRows: string[] = uniqueTags.filter((tag: string) =>
      selectedTableRows.some((row: any) => row.tags.includes(tag)) &&
      !tagsInAllRows.includes(tag)
    );
    
    
    const initialSelectedTags = mapTagsToSelectOptions(tagsList).filter((tag: OptionType) =>
      tagsInAllRows.includes(tag.label) || tagsInSomeRows.includes(tag.label)
    );

    setSelectedTags(initialSelectedTags);
    setTagsInSomeRows(tagsInSomeRows);
    setTagsInAllRows(tagsInAllRows);
  }, [selectedTableRows, tagsList]);

  return (
    <>
      <Tooltip arrow title={'Manage tag(s)'}>
        <IconButton onClick={handleViewTagsMenu}>
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
        confirmButtonText="Apply"
        onConfirm={handleConfirm}
        variant="checkbox"
        optionsInAllRows={tagsInAllRows}
        optionsInSomeRows={tagsInSomeRows}
      />
    </>
  )
}

export default ManageTags