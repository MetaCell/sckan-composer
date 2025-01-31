import IconButton from "@mui/material/IconButton";
import {PersonAddIcon} from "../icons";
import CustomSearchSelect from "./CustomSearchSelect";
import React, {useState} from "react";
import Tooltip from "@mui/material/Tooltip";

interface User {
  id: number
  name: string
  email: string
}

export interface OptionType {
  id: number
  label: string
}

const users: User[] = [
  { id: 1, name: "Lana Steiner", email: "lana@example.com" },
  { id: 2, name: "Candice Wu", email: "candice@example.com" },
]

const mapUsersToSelectOptions = (users: User[]) => {
  return users.map((user) => ({
    id: user.id,
    label: user.name,
  }));
};
const AssignUser = () => {
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
    // TODO: Assign selected users to the selected entities
    console.log("Confirmed selections:", selectedUsers)
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
        data={mapUsersToSelectOptions(users)}
        selectedOptions={selectedUsers}
        onOptionSelect={handleSelectUser}
        placeholder="Search for users"
        confirmButtonText="Assign"
        onConfirm={handleConfirm}
      />
    </>
  )
}

export default AssignUser