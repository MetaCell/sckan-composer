import IconButton from "@mui/material/IconButton";
import { PersonAddIcon } from "../icons";
import CustomSearchSelect from "./CustomSearchSelect";
import React, { useState } from "react";
import Tooltip from "@mui/material/Tooltip";
import sentenceService from "../../services/SentenceService";
import { QueryParams as SentenceQueryParams } from "../../redux/sentenceSlice";
import { QueryParams as StatementQueryParams } from "../../redux/statementSlice";
import { ENTITY_TYPES } from "../../helpers/settings";
import { OptionType } from "../../types";
import connectivityStatementService from "../../services/StatementService";

interface User {
  id: number;
  full_name: string;
}

interface AssignUserProps {
  selectedTableRows: any[];
  entityType: ENTITY_TYPES;
  assignableUsers: User[];
  queryOptions: SentenceQueryParams | StatementQueryParams;
  onClick: () => void;
  onConfirm: () => void;
}

const mapUsersToSelectOptions = (users: User[]) => {
  return users.map((user) => ({
    id: user.id,
    label: user.full_name,
  }));
};

const AssignUser: React.FC<AssignUserProps> = ({ selectedTableRows, entityType, assignableUsers, queryOptions, onClick, onConfirm }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<OptionType | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const assignUserMap: Record<
    ENTITY_TYPES,
    (queryOptions: SentenceQueryParams | StatementQueryParams, userId: number) => Promise<{ message: string }>
  > = {
    [ENTITY_TYPES.SENTENCE]: (queryOptions, userId) =>
      sentenceService.assignUserBulk(queryOptions as SentenceQueryParams, userId),
    [ENTITY_TYPES.STATEMENT]: (queryOptions, userId) =>
      connectivityStatementService.assignUserBulk(queryOptions as StatementQueryParams, userId),
  };

  const handleClose = () => {
    setAnchorEl(null);
    setSearchTerm("");
  };

  const handleSelectUser = (user: OptionType) => {
    setSelectedUser(user);
  };

  const handleConfirm = async () => {
    if (!selectedUser) return;
    setIsLoading(true);

    try {
      const assignUserFunction = assignUserMap[entityType as ENTITY_TYPES]; // Explicitly cast entityType
      if (!assignUserFunction) throw new Error(`No function found for ${entityType}`);

      await assignUserFunction(queryOptions, selectedUser.id);
      console.log("Assigned user:", selectedUser, "to sentences:", selectedTableRows, "Entity:", entityType);
    } catch (error) {
      console.error("Error assigning user:", error);
    } finally {
      setIsLoading(false);
      onConfirm();
    }

    handleClose();
  };

  const handleViewUsersMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    onClick();
  };

  return (
    <>
      <Tooltip arrow title={"Assign to a user"}>
        <IconButton onClick={handleViewUsersMenu} disabled={isLoading}>
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
        selectedOptions={selectedUser ? [selectedUser.label] : []} // Only 1 selection
        onOptionSelect={handleSelectUser}
        placeholder="Search for users"
        confirmButtonText={isLoading ? "Assigning..." : "Assign"}
        onConfirm={handleConfirm}
        showHelperText={true}
        helperText={`Having trouble finding someone? </br>The list of available users is based on their roles and permissions. Contact us if you need any help.`}
      />
    </>
  );
};

export default AssignUser;
