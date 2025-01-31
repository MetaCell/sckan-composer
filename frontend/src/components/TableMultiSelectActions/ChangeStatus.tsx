import React, { useState } from "react";
import PopoverMenu from "./PopoverMenu";
import { ChangeStatusIcon, ChangeStatusDialogIcon } from "../icons";
import { ChangeRequestStatus } from "../../helpers/settings";
import ConfirmationDialog from "../ConfirmationDialog";

interface ChangeStatusProps {
  selectedTableRows: Array<{ state: string; id: string | number }>;
  entityType: string;
}

const ChangeStatus: React.FC<ChangeStatusProps> = ({ selectedTableRows, entityType }) => {
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [newStatus, setNewStatus] = useState<string | null>(null);
  
  const statusOptions = Object.values(ChangeRequestStatus);
  
  const handleSelectStatus = (status: string) => {
    setNewStatus(status);
    if (dontShowAgain) {
      handleStatusConfirm(status);
    } else {
      setIsModalOpen(true);
    }
  };
  
  const handleStatusChange = (newStatus: string) => {
    // TODO: API call to change status
    console.log(`Changing status to: ${newStatus}`);
  };
  
  const handleStatusConfirm = (status: string) => {
    setSelectedStatus(status);
    handleStatusChange(status);
    setIsModalOpen(false);
  };
  
  const handleModalCancel = () => {
    setIsModalOpen(false);
    setNewStatus(null);
  };
  
  const isUniformState = () => {
    if (!Array.isArray(selectedTableRows) || selectedTableRows.length === 0) return false;
    const firstState = selectedTableRows[0]?.state;
    return selectedTableRows.every((item) => item.state === firstState);
  };
  
  return (
    <>
      <PopoverMenu
        icon={ChangeStatusIcon}
        tooltip={isUniformState() ? "Change status" : "Select statements with the same status to enable bulk change"}
        actionButtonDisabled={!isUniformState()}
        options={statusOptions}
        selectedOption={selectedStatus}
        onSelect={handleSelectStatus}
      />
      <ConfirmationDialog
        open={isModalOpen}
        onConfirm={() => handleStatusConfirm(newStatus!)}
        onCancel={handleModalCancel}
        title={`Change status of ${selectedTableRows.length} ${entityType}.`}
        confirmationText={`By proceeding, the selected ${entityType} <strong>status</strong> will change from ${selectedTableRows[0]?.state} to ${newStatus}. Are you sure?`}
        Icon={<ChangeStatusDialogIcon />}
        dontShowAgain={dontShowAgain}
        setDontShowAgain={setDontShowAgain}
      />
    </>
  );
};

export default ChangeStatus;
