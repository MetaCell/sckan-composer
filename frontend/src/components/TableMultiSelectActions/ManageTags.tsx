import IconButton from "@mui/material/IconButton";
import {LabelAddIcon} from "../icons";
import CustomSearchSelect from "./CustomSearchSelect";
import React, {useEffect, useState} from "react";
import Tooltip from "@mui/material/Tooltip";
import {tags} from "../../services/TagService";
import {Tag} from "../../apiclient/backend";
const ManageTags = ({selectedTableRows}: any) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTags, setSelectedTags] = useState<Tag[]>([])
  const [tagsList, setTagsList] = useState<Tag[]>([])
  const handleClose = () => {
    setAnchorEl(null)
    setSearchTerm("")
  }
  
  const handleSelectTag = (user: Tag) => {
    setSelectedTags((prevSelected) => {
      const isAlreadySelected = prevSelected.some((selectedUser) => selectedUser.id === user.id)
      if (isAlreadySelected) {
        return prevSelected.filter((selectedUser) => selectedUser.id !== user.id)
      } else {
        return [...prevSelected, user]
      }
    })
  }
  
  const handleConfirm = (selectedOptions: Tag[]) => {
    console.log("Confirmed selections:", selectedOptions)
    handleClose()
  }
  
  const handleViewTagsMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }
  
  useEffect(() => {
    const tagsList = tags.getTagList()
    setTagsList(tagsList)
  }, [])
  
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
        data={tagsList}
        getOptionLabel={(tag: Tag) => tag.tag}
        selectedOptions={selectedTags}
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