import React, { useState } from "react";
import PopoverMenu from "./PopoverMenu";
import { ChangeStatusIcon, ChangeStatusDialogIcon } from "../icons";
import ConfirmationDialog from "../ConfirmationDialog";
import sentenceService from "../../services/SentenceService";
import connectivityStatementService from "../../services/StatementService";
import { QueryParams as SentenceQueryParams } from "../../redux/sentenceSlice";
import { QueryParams as StatementQueryParams } from "../../redux/statementSlice";
import { ENTITY_TYPES } from "../../helpers/settings";
import { SentenceLabels, StatementsLabels } from "../../helpers/helpers";

interface PopoverOptionType {
  label: string;
  value: string;
}

interface ChangeStatusProps {
  selectedTableRows: any;
  selectedRowsCount: number;
  entityType: ENTITY_TYPES;
  possibleTransitions: string[];
  queryOptions: SentenceQueryParams | StatementQueryParams;
  onClick: () => void;
  onConfirm: () => void;
  setGridLoading: (loading: boolean) => void;
  isGridLoading: boolean;
  isFetchingOptions: boolean;
}

const ChangeStatus: React.FC<ChangeStatusProps> = ({
  selectedTableRows,
  entityType,
  possibleTransitions,
  queryOptions,
  onClick,
  onConfirm,
  isFetchingOptions,
  selectedRowsCount,
  setGridLoading,
  isGridLoading,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<PopoverOptionType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [newStatus, setNewStatus] = useState<PopoverOptionType | null>(null);

  const statusLabels = entityType === ENTITY_TYPES.SENTENCE ? SentenceLabels : StatementsLabels;

  const transitionOptions: PopoverOptionType[] = possibleTransitions.map((status) => ({
    label: statusLabels[status as keyof typeof statusLabels] || status,
    value: status,
  }));
  

  const changeStatusMap: Record<
    ENTITY_TYPES,
    (queryOptions: SentenceQueryParams | StatementQueryParams, newStatus: string) => Promise<{ message: string }>
  > = {
    [ENTITY_TYPES.SENTENCE]: (queryOptions, newStatus) =>
      sentenceService.changeStatusBulk(queryOptions as SentenceQueryParams, newStatus),
    [ENTITY_TYPES.STATEMENT]: (queryOptions, newStatus) =>
      connectivityStatementService.changeStatusBulk(queryOptions as StatementQueryParams, newStatus),
  };

  const handleOpenMenu = () => {
    onClick(); // Fetch updated transitions
  };

  const handleSelectStatus = (statusOption: PopoverOptionType) => {
    setNewStatus(statusOption);
    if (dontShowAgain) {
      handleStatusConfirm(statusOption);
    } else {
      setIsModalOpen(true);
    }
  };

  const handleStatusChange = async (statusOption: PopoverOptionType) => {
    if (!statusOption) return;
    setGridLoading(true);

    try {
      const changeStatusFunction = changeStatusMap[entityType];
      if (!changeStatusFunction) throw new Error(`No function found for ${entityType}`);
      await changeStatusFunction(queryOptions, statusOption.value);
    } catch (error) {
      console.error("Error changing status:", error);
    } finally {
      setGridLoading(false);
      onConfirm();
    }
  };

  const handleStatusConfirm = (statusOption: PopoverOptionType) => {
    setSelectedStatus(statusOption);
    handleStatusChange(statusOption);
    setIsModalOpen(false);
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
    setNewStatus(null);
  };

  const fromState = selectedTableRows[0]?.state
    ? statusLabels[selectedTableRows[0]?.state as keyof typeof statusLabels] || selectedTableRows[0]?.state
    : "";
  const toState = newStatus ? newStatus.label : "";

  return (
    <>
      <PopoverMenu
        icon={ChangeStatusIcon}
        tooltip={"Change status"}
        actionButtonDisabled={isGridLoading}
        options={transitionOptions}
        selectedOption={selectedStatus}
        onSelect={handleSelectStatus}
        onOpen={handleOpenMenu}
        noOptionsText={"No options available!"}
        isFetchingOptions={isFetchingOptions}
      />
      <ConfirmationDialog
        open={isModalOpen}
        onConfirm={() => handleStatusConfirm(newStatus!)}
        onCancel={handleModalCancel}
        title={`Change status of ${selectedRowsCount} ${entityType}.`}
        confirmationText={`By proceeding, the selected ${entityType} <strong>status</strong> will change from ${fromState} to ${toState}. Are you sure?`}
        Icon={<ChangeStatusDialogIcon />}
        dontShowAgain={dontShowAgain}
        setDontShowAgain={setDontShowAgain}
      />
    </>
  );
};

export default ChangeStatus;
