import React, {useCallback, useEffect, useMemo} from "react";
import Box from "@mui/material/Box";
import {
  DataGrid,
  GridRowsProp,
  GridColDef,
  GridEventListener,
} from "@mui/x-data-grid";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { BaseConnectivityStatement, Sentence, Tag } from "../apiclient/backend";
import {
  renderDate,
  renderNote,
  renderID,
  renderSentenceState,
  renderStatementState,
  renderTag,
  renderTitle,
} from "./DataGridWidgets/DataGridWidgets";
import CustomPagination from "./CustomPagination";
import { QueryParams as SentenceQueryParams } from "../redux/sentenceSlice";
import { QueryParams as StatementQueryParams } from "../redux/statementSlice";
import { mapSortingModel } from "../helpers/helpers";
import {
  setIndex as setSentenceIndex,
  setSorting as setSentenceSorting,
} from "../redux/sentenceSlice";
import {
  setIndex as setStatementIndex,
  setSorting as setStatementSorting,
} from "../redux/statementSlice";
import { useAppDispatch } from "../redux/hooks";
import { useNavigate } from "react-router";
import Stack from "@mui/material/Stack";
import {Checkbox} from "@mui/material";
import {CheckedItemIcon, IndeterminateIcon, UncheckedItemIcon} from "./icons";
import {vars} from "../theme/variables";
import {ENTITY_TYPES} from "../helpers/settings";

interface DataGridProps {
  entityType: ENTITY_TYPES.STATEMENT | ENTITY_TYPES.SENTENCE;
  entityList: (Sentence | BaseConnectivityStatement)[] | undefined;
  allowSortByOwner?: boolean;
  queryOptions: SentenceQueryParams | StatementQueryParams;
  loading: boolean;
  totalResults: number;
  setSelectedRows: (selectedRows: number[]) => void;
  selectedRows: number[];
  isAllDataSelected: boolean;
  manuallyDeselectedRows: string[];
  setManuallyDeselectedRows: (selectedRows: string[]) => void;
}

type criteria =
  | ("id" | "-id" | "last_edited" | "-last_edited" | "owner" | "-owner")[]
  | undefined;


export const StyledCheckBox = (props: any) => {
  return (
    <Checkbox
      {...props}
      sx={{ padding: 0 }}
      checkedIcon={<CheckedItemIcon sx={{ fontSize: 16 }} />}
      icon={<UncheckedItemIcon sx={{ fontSize: 16 }} />}
      indeterminateIcon={<IndeterminateIcon sx={{ fontSize: 16 }} />}
    />
  );
};
const EntityDataGrid = (props: DataGridProps) => {
  const { entityList, entityType, queryOptions, loading, totalResults, allowSortByOwner = false, setSelectedRows, selectedRows, isAllDataSelected, manuallyDeselectedRows, setManuallyDeselectedRows } = props;

  const currentPage = (queryOptions.index || 0) / queryOptions.limit;

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  const generateRowProps = useCallback((item: any) => {
    const { id, state, modified_date, owner, tags, has_notes } = item;
    const ownerName = !owner ? "" : `${owner.first_name} ${owner.last_name}`;
    const commonRowProps = {
      id,
      state,
      last_edited: modified_date,
      owner: ownerName,
      tags: tags.map((t: Tag) => t.tag),
      notes: has_notes,
    };
    if (entityType === "sentence") {
      const { text } = item;
      return { ...commonRowProps, text };
    }
    if (entityType === "statement") {
      const { knowledge_statement } = item;
      return { ...commonRowProps, knowledge_statement };
    }
    return {};
  }, [entityType]);

  const rows: GridRowsProp = useMemo(() => {
    return entityList?.map(generateRowProps) || [];
  }, [entityList, generateRowProps]);

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", renderCell: renderID },
    {
      field: entityType === "sentence" ? "text" : "knowledge_statement",
      headerName:
        entityType === "sentence" ? "Sentence" : "Knowledge Statement",
      flex: 2,
      sortable: false,
      renderCell: renderTitle,
    },
    {
      field: "state",
      headerName: "Status",
      sortable: false,
      flex: 1,
      renderCell:
        entityType === "sentence" ? renderSentenceState : renderStatementState,
    },
    {
      field: "last_edited",
      headerName: "Last edited",
      flex: 1,
      renderCell: renderDate,
    },
    { field: "owner", headerName: "Owner", flex: 1, sortable: allowSortByOwner },
    {
      field: "tags",
      headerName: "Tags",
      sortable: false,
      flex: 1,
      renderCell: renderTag,
    },
    {
      field: "notes",
      headerName: "Notes",
      sortable: false,
      flex: 0.5,
      renderCell: renderNote,
    },
    {
      field: "icon",
      headerName: "",
      sortable: false,
      flex: 0.1,
      renderCell: () => <ChevronRightIcon fontSize="small" />,
    },
  ];

  const handlePageChange = (newPage: number) => {
    const index = newPage * queryOptions.limit;
    entityType === "sentence"
      ? dispatch(setSentenceIndex(index))
      : dispatch(setStatementIndex(index));
  };

  const handleRowClick: GridEventListener<"rowClick"> = (params) => {
    entityType === "sentence"
      ? navigate(`sentence/${params.row.id}`)
      : navigate(`/statement/${params.row.id}`);
  };
  const handleSortModelChange = (model: any) => {
    let ordering: criteria;
    if (model.length === 0) {
      ordering = undefined;
    } else {
      const { field, sort } = model[0];
      const sortingCriteria = `${field} ${sort}`;
      if (sortingCriteria === "id asc") {
        ordering = ["id"];
      } else if (sortingCriteria === "id desc") {
        ordering = ["-id"];
      } else if (sortingCriteria === "last_edited asc") {
        ordering = ["last_edited"];
      } else if (sortingCriteria === "last_edited desc") {
        ordering = ["-last_edited"];
      } else if (sortingCriteria === "owner asc") {
        ordering = ["owner"];
      } else if (sortingCriteria === "owner desc") {
        ordering = ["-owner"];
      } else {
        ordering = undefined;
      }
    }
    entityType === "sentence"
      ? dispatch(setSentenceSorting(ordering))
      : dispatch(setStatementSorting(ordering));
  };
  
  const allRowIds = useMemo(() => rows.map((row) => row.id), [rows]);
  
  useEffect(() => {
    if (isAllDataSelected) {
      const newSelectedRows = allRowIds.filter(id => !manuallyDeselectedRows.includes(id));
      if (JSON.stringify(newSelectedRows) !== JSON.stringify(selectedRows)) {
        setSelectedRows(newSelectedRows);
      }
    }
  }, [isAllDataSelected, manuallyDeselectedRows, allRowIds, selectedRows, setSelectedRows]);

  const handleRowSelectionChange = (selectedRowIds: number[]) => {
    if (isAllDataSelected) {
      const newlyDeselectedRows = [...manuallyDeselectedRows];
      
      allRowIds.forEach((id) => {
        if (!selectedRowIds.includes(id) && !newlyDeselectedRows.includes(id)) {
          newlyDeselectedRows.push(id);
        } else if (selectedRowIds.includes(id)) {
          const index = newlyDeselectedRows.indexOf(id);
          if (index !== -1) {
            newlyDeselectedRows.splice(index, 1);
          }
        }
      });
      
      setManuallyDeselectedRows(newlyDeselectedRows);
    } else {
      setSelectedRows(selectedRowIds);
    }
  };
  return (
    <Box
      flexGrow={1}
      height={`calc(100vh - ${entityType === "sentence" ? 320 : 355}px)`}
    >
      <DataGrid
        rows={rows}
        columns={columns}
        getRowHeight={() => "auto"}
        paginationMode="server"
        sortingMode="server"
        loading={loading}
        rowCount={totalResults}
        checkboxSelection
        onRowClick={handleRowClick}
        slots={{
          baseCheckbox: StyledCheckBox,
          noRowsOverlay: () => (
            <Stack height="100%" alignItems="center" justifyContent="center">
              {`No ${entityType}s to display, clear your filter or modify your search criteria`}
            </Stack>
          ),
          pagination: CustomPagination,
        }}
        hideFooterSelectedRowCount={true}
        paginationModel={{
          page: currentPage,
          pageSize: queryOptions.limit,
        }}
        onPaginationModelChange={(model) => {
          handlePageChange(model.page);
        }}
        onSortModelChange={(model) => handleSortModelChange(model)}
        disableColumnMenu
        initialState={
          queryOptions.ordering
            ? mapSortingModel(queryOptions.ordering[0])
            : undefined
        }
        rowSelectionModel={selectedRows}
        keepNonExistentRowsSelected={true}
        onRowSelectionModelChange={(selectedRowIds) => handleRowSelectionChange(selectedRowIds as number[])}
        sx={{
          borderRadius: 0,
          borderColor: vars.gray200,
          borderTop: 0
        }}
      />
    </Box>
  );
};

export default EntityDataGrid;
