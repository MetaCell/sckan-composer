import React, { useState } from "react";
import PopoverMenu from "./PopoverMenu";
import { ChangeStatusIcon, ChangeStatusDialogIcon } from "../icons";
import { SentenceLabels, StatementsLabels } from "../../helpers/helpers";
import ConfirmationDialog from "../ConfirmationDialog";
import sentenceService from "../../services/SentenceService";
import { QueryParams as SentenceQueryParams } from "../../redux/sentenceSlice";
import {QueryParams as StatementQueryParams, setDialogState} from "../../redux/statementSlice";
import { ENTITY_TYPES } from "../../helpers/settings";
import connectivityStatementService from "../../services/StatementService";
import {useDispatch, useSelector} from "react-redux";
import {RootState} from "../../redux/store";
import { PopoverOptionType } from "../../types";

interface ChangeStatusProps {
  selectedRowsCount: number;
  entityType: ENTITY_TYPES;
  possibleTransitions: string[];
  queryOptions: SentenceQueryParams | StatementQueryParams;
  onClick: () => void;
  onConfirm: () => void;
  setGridLoading: (loading: boolean) => void;
  isGridLoading: boolean;
  isFetchingOptions: boolean;
  originalStatus: string;
}

const ChangeStatus: React.FC<ChangeStatusProps> = ({ entityType, possibleTransitions, queryOptions, onClick, onConfirm, isFetchingOptions, selectedRowsCount, setGridLoading, isGridLoading, originalStatus }) => {
  const [selectedStatus, setSelectedStatus] = useState<PopoverOptionType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dialogsState = useSelector((state: RootState) => state.statement.dialogs);

  const dispatch = useDispatch();

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
      connectivityStatementService.changeStatusBulk(queryOptions as StatementQueryParams, newStatus)
  };

  const handleOpenMenu = () => {
    onClick(); // Fetch updated transitions
  };

  const handleSelectStatus = (statusOption: PopoverOptionType) => {
    setSelectedStatus(statusOption);
    if (dialogsState.changeStatus) {
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
    setSelectedStatus(null);
  };

  const fromState = statusLabels[originalStatus as keyof typeof statusLabels];
  const toState = selectedStatus ? selectedStatus.label : "";


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
        onConfirm={() => handleStatusConfirm(selectedStatus!)}
        onCancel={handleModalCancel}
        title={`Change status of ${selectedRowsCount} ${entityType}.`}
        confirmationText={`By proceeding, the selected ${entityType} <strong>status</strong> will change from ${fromState} to ${toState}. Are you sure?`}
        Icon={<ChangeStatusDialogIcon />}
        dontShowAgain={dialogsState.changeStatus}
        setDontShowAgain={() => dispatch(setDialogState({ dialogKey: "changeStatus", dontShow: true }))}
      />
    </>
  );
};

export default ChangeStatus;
