import IconButton from "@mui/material/IconButton";
import {LabelAddIcon} from "../icons";
import CustomSearchSelect from "./CustomSearchSelect";
import React, {useEffect, useState} from "react";
import Tooltip from "@mui/material/Tooltip";
import {tags} from "../../services/TagService";
import {Tag} from "../../apiclient/backend";
const ManageTags = () => {
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
      />
    </>
  )
}

export default ManageTags