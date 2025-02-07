import IconButton from "@mui/material/IconButton";
import {PersonAddIcon} from "../icons";
import CustomSearchSelect from "./CustomSearchSelect";
import React, {useState} from "react";
import Tooltip from "@mui/material/Tooltip";

interface User {
  id: number
  full_name: string
}

export interface OptionType {
  id: number
  label: string
}


const mapUsersToSelectOptions = (users: User[]) => {
  return users.map((user) => ({
    id: user.id,
    label: user.full_name,
  }));
};
const AssignUser = ({selectedTableRows, entityType, assignableUsers}: any) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<OptionType[]>([])
  const handleClose = () => {
    setAnchorEl(null)
    setSearchTerm("")
  }
  
  const handleSelectUser = (user: OptionType) => {
    setSelectedUsers((prevSelected) => {
      const isAlreadySelected = prevSelected.some((selectedUser) => selectedUser.id === user.id)
      if (isAlreadySelected) {
        return prevSelected.filter((selectedUser) => selectedUser.id !== user.id)
      } else {
        return [...prevSelected, user]
      }
    })
  }
  
  const handleConfirm = () => {
    // TODO: API call to Assign selected users to the selected entities
    console.log("Confirmed selections:", selectedUsers, selectedTableRows, entityType)
    handleClose()
  }
  
  const handleViewUsersMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }
  
  return (
    <>
      <Tooltip arrow title={'Assign to a user'}>
        <IconButton onClick={handleViewUsersMenu}>
          <PersonAddIcon />
        </IconButton>
      </Tooltip>
     
      <CustomSearchSelect
        open={Boolean(anchorEl)}
        handleClose={handleClose}
        anchorEl={anchorEl}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        data={mapUsersToSelectOptions(assignableUsers)}
        selectedOptions={selectedUsers.map((user: OptionType) => user.label)}
        onOptionSelect={handleSelectUser}
        placeholder="Search for users"
        confirmButtonText="Assign"
        onConfirm={handleConfirm}
        showHelperText={true}
        helperText={`Having trouble finding someone? </br>The list of available users is based on their roles and permissions. contact us if you need any help`}
      />
    </>
  )
}

export default AssignUser