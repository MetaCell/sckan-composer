import React from "react";
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

interface DataGridProps {
  entityType: "sentence" | "statement";
  entityList: (Sentence | BaseConnectivityStatement)[] | undefined;
  queryOptions: SentenceQueryParams | StatementQueryParams;
  loading: boolean;
  totalResults: number;
}

type criteria =
  | ("id" | "-id" | "last_edited" | "-last_edited" | "owner" | "-owner")[]
  | undefined;

const EntityDataGrid = (props: DataGridProps) => {
  const { entityList, entityType, queryOptions, loading, totalResults } = props;

  const currentPage = (queryOptions.index || 0) / queryOptions.limit;

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const generateRowProps = (item: any) => {
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
      const { id, text } = item;
      return { ...commonRowProps, id, text };
    }
    if (entityType === "statement") {
      const {  id, knowledge_statement } = item;
      return { ...commonRowProps, id: id, knowledge_statement };
    }
    return {};
  };

  const rows: GridRowsProp =
    entityList?.map((item) => generateRowProps(item)) || [];

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
    { field: "owner", headerName: "Owner", flex: 1 },
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

  return (
    <Box
      flexGrow={1}
      height={`calc(100vh - ${entityType === "sentence" ? 320 : 355}px)`}
    >
      <DataGrid
        rows={rows}
        columns={columns}
        getRowHeight={() => "auto"}
        pageSize={queryOptions.limit}
        paginationMode="server"
        sortingMode="server"
        loading={loading}
        rowCount={totalResults}
        onPageChange={handlePageChange}
        onRowClick={handleRowClick}
        onSortModelChange={handleSortModelChange}
        rowsPerPageOptions={[queryOptions.limit]}
        page={currentPage}
        disableColumnMenu
        initialState={
          queryOptions.ordering
            ? mapSortingModel(queryOptions.ordering[0])
            : undefined
        }
        components={{
          Pagination: CustomPagination,
          NoRowsOverlay: () => (
              <Stack height="100%" alignItems="center" justifyContent="center">
                {`No ${entityType}s to display, clear your filter or modify your search criteria`}
              </Stack>
          )
        }}
      />
    </Box>
  );
};

export default EntityDataGrid;
