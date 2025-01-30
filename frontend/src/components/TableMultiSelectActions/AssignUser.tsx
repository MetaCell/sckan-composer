import IconButton from "@mui/material/IconButton";
import {PersonAddIcon} from "../icons";
import CustomSearchSelect from "../Widgets/CustomSearchSelect";
import React, {useState} from "react";
import Tooltip from "@mui/material/Tooltip";

interface User {
  id: number
  name: string
  email: string
}

const users: User[] = [
  { id: 1, name: "Lana Steiner", email: "lana@example.com" },
  { id: 2, name: "Candice Wu", email: "candice@example.com" },
]

const AssignUser = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const handleClose = () => {
    setAnchorEl(null)
    setSearchTerm("")
  }
  
  const handleSelectUser = (user: User) => {
    setSelectedUsers((prevSelected) => {
      const isAlreadySelected = prevSelected.some((selectedUser) => selectedUser.id === user.id)
      if (isAlreadySelected) {
        return prevSelected.filter((selectedUser) => selectedUser.id !== user.id)
      } else {
        return [...prevSelected, user]
      }
    })
  }
  
  const handleConfirm = (selectedOptions: User[]) => {
    console.log("Confirmed selections:", selectedOptions)
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
        data={users}
        getOptionLabel={(user) => user.name}
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