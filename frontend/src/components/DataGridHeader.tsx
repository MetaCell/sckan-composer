import React, { useState, useCallback, useMemo } from "react";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import FilterListIcon from "@mui/icons-material/FilterList";
import Searchbar from "./Searchbar";
import FilterDrawer from "./Filters/FilterDrawer";
import { QueryParams as SentenceQueryParams } from "../redux/sentenceSlice";
import { QueryParams as StatementQueryParams } from "../redux/statementSlice";
import { setFilters as setSentenceFilters } from "../redux/sentenceSlice";
import { setFilters as setStatementFilters } from "../redux/statementSlice";
import { useAppDispatch } from "../redux/hooks";
import Stack from "@mui/material/Stack";
import { Divider, Typography } from "@mui/material";
import AssignUser from "./TableMultiSelectActions/AssignUser";
import { vars } from "../theme/variables";
import ManageTags from "./TableMultiSelectActions/ManageTags";
import ChangeStatus from "./TableMultiSelectActions/ChangeStatus";
import AddNote from "./TableMultiSelectActions/AddNote";
import AssignPopulationSet from "./TableMultiSelectActions/AssignPopulationSet";
import { ENTITY_TYPES } from "../helpers/settings";
import sentenceService from "../services/SentenceService";
import connectivityStatementService from "../services/StatementService";

const toolbarStyle = {
  background: vars.whiteColor,
  padding: 2,
  borderRadius: "12px 12px 0 0",
  border: `1px solid ${vars.gray200}`,
};

const multiSelectActionsStyle = {
  "& .MuiButtonBase-root": {
    padding: "0.125rem",
    borderRadius: "8px",
    "&.Mui-disabled": {
      "& .MuiSvgIcon-root": {
        "& path": {
          fill: `${vars.gray300} !important`,
        },
      },
    },
  },
  "& .MuiDivider-root": {
    width: "0.0625rem",
    height: "1.5rem",
    background: vars.gray200,
    borderColor: vars.gray200,
    alignSelf: "center",
  },
};

interface DataGridHeaderProps {
  queryOptions: SentenceQueryParams | StatementQueryParams;
  entityType: ENTITY_TYPES.STATEMENT | ENTITY_TYPES.SENTENCE;
  selectedRows: number[];
  refreshList: () => void;
  setGridLoading: (loading: boolean) => void;
  isGridLoading: boolean;
  isAllDataSelected: boolean;
  selectedRowsCount: number;
  manuallyDeselectedRows: string[];
}

type Tag = {
  id: number;
  tag: string;
};

type Tags = {
  used_by_all: Tag[];
  used_by_some: Tag[];
  unused: Tag[];
};

const DataGridHeader = (props: DataGridHeaderProps) => {
  const { queryOptions, entityType, selectedRows, refreshList, isAllDataSelected, selectedRowsCount, manuallyDeselectedRows, setGridLoading, isGridLoading } = props;
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isFetchingOptions, setIsFetchingOptions] = useState(false);
  const [assignableUsers, setAssignableUsers] = useState<any[]>([]);
  const [possibleTransitions, setPossibleTransitions] = useState<string[]>([]);
  const [tagsStatus, setTagsStatus] = useState<Tags[]>([]);
  const [previousFetchDeps, setPreviousFetchDeps] = useState<{
    selectedRows: number[];
    queryOptions: SentenceQueryParams | StatementQueryParams;
    entityType: ENTITY_TYPES;
  } | null>(null);

  const dispatch = useAppDispatch();

  const handleClearFilter = () => {
    const noFilters = { stateFilter: undefined, tagFilter: undefined };
    entityType === "sentence"
      ? dispatch(setSentenceFilters(noFilters))
      : dispatch(setStatementFilters(noFilters));
  };

  const updatedQueryOptions: SentenceQueryParams | StatementQueryParams = useMemo(() => {
    return {
      ...queryOptions,
      include: !isAllDataSelected ? selectedRows : undefined,
      exclude: isAllDataSelected ? manuallyDeselectedRows : undefined,
    };
  }, [queryOptions, isAllDataSelected, selectedRows, manuallyDeselectedRows]);

  const fetchOptionsMap = useMemo(() => ({
    [ENTITY_TYPES.SENTENCE]: () =>
      sentenceService.fetchOptions(updatedQueryOptions as SentenceQueryParams),
    [ENTITY_TYPES.STATEMENT]: () =>
      connectivityStatementService.fetchOptions(updatedQueryOptions as StatementQueryParams),
  }), [updatedQueryOptions]);

  // Function to fetch options only when triggered by button click
  const handleFetchOptions = useCallback(async (changed?: boolean) => {
    const hasChanged =
      !previousFetchDeps || changed ||
      previousFetchDeps.selectedRows !== selectedRows ||
      previousFetchDeps.queryOptions !== queryOptions ||
      previousFetchDeps.entityType !== entityType;

    if (hasChanged) {
      setIsFetchingOptions(true);
      try {
        const fetchFunction =
          fetchOptionsMap[entityType] || fetchOptionsMap[ENTITY_TYPES.STATEMENT];
        const options = await fetchFunction();
        setAssignableUsers(options.assignable_users);
        setPossibleTransitions(options.possible_transitions.transitions);
        // @ts-ignore
        setTagsStatus(options.tags);
        setPreviousFetchDeps({ selectedRows, queryOptions, entityType }); // Store last fetch state
        setIsFetchingOptions(false);
      } catch (error) {
        setIsFetchingOptions(false);
        console.error("Failed to fetch options:", error); // TODO: Show error to user
      }
    }
  }, [selectedRows, queryOptions, entityType, previousFetchDeps, fetchOptionsMap]); // Only re-run when dependencies change

  const onConfirm = async () => {
    await refreshList();
    handleFetchOptions(true)
  }

  return (
    <Grid container display="flex" justifyContent="space-between" alignItems="center" sx={toolbarStyle}>
      <Grid item xs={12} md={3}>
        <Searchbar queryOptions={queryOptions} entityType={entityType} />
      </Grid>

      <Grid item xs={12} md={9} display="flex" alignItems="center" justifyContent="end" gap="1rem">
        {selectedRows && selectedRows.length > 0 && (
          <Stack direction="row" alignItems="center" spacing={1} sx={multiSelectActionsStyle}>
            <Typography variant="body2">
              {selectedRowsCount} {entityType}
              {selectedRowsCount > 1 ? "s" : ""} selected
            </Typography>
            <Divider flexItem />
            <AssignUser
              selectedTableRows={selectedRows}
              entityType={entityType}
              assignableUsers={assignableUsers}
              queryOptions={updatedQueryOptions}
              onClick={handleFetchOptions}
              onConfirm={onConfirm}
              isFetchingOptions={isFetchingOptions}
            />
            <ManageTags isFetchingOptions={isFetchingOptions} onClick={handleFetchOptions} tagsStatus={tagsStatus} entityType={entityType} queryOptions={updatedQueryOptions} onConfirm={refreshList} />
            <AddNote selectedRowsCount={selectedRowsCount} entityType={entityType} queryOptions={updatedQueryOptions} onConfirm={refreshList} />
            <ChangeStatus
              selectedTableRows={selectedRows}
              entityType={entityType}
              possibleTransitions={possibleTransitions}
              queryOptions={updatedQueryOptions}
              onClick={handleFetchOptions}
              onConfirm={onConfirm}
              isFetchingOptions={isFetchingOptions}
              selectedRowsCount={selectedRowsCount}
              setGridLoading={setGridLoading}
              isGridLoading={isGridLoading}
            />
            <AssignPopulationSet selectedTableRows={selectedRows} entityType={entityType} />
            <Divider flexItem />
          </Stack>
        )}
        <Button variant="outlined" color="secondary" onClick={() => setIsFilterDrawerOpen(true)} endIcon={<FilterListIcon />}>
          Filters
        </Button>
        <Drawer anchor="right" open={isFilterDrawerOpen} onClose={() => setIsFilterDrawerOpen(false)} ModalProps={{ sx: { zIndex: 1300 } }}>
          <FilterDrawer toggleDrawer={setIsFilterDrawerOpen} queryOptions={queryOptions} entity={entityType} />
        </Drawer>
        {(queryOptions.stateFilter || queryOptions.tagFilter) && <Button onClick={handleClearFilter}>Clear Filter</Button>}
      </Grid>
    </Grid>
  );
};

export default DataGridHeader;
