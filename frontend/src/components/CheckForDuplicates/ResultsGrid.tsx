import * as React from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { duplicatesRowsPerPage } from "../../helpers/settings";
import CustomPagination from "../CustomPagination";
import {
  renderPMID,
  renderState,
  renderTitle,
} from "../DataGridWidgets/DataGridWidgets";

export default function ResultsGrid({
  rows,
  totalResults,
  handlePageChange,
  handleSortModelChange,
  currentPage,
}: any) {
  const columns: GridColDef[] = [
    {
      field: "pmid",
      headerName: "PMID",
      headerClassName: "grid--header",
      renderCell: renderPMID,
    },
    {
      field: "state",
      headerName: "Status",
      sortable: false,
      flex: 1,
      headerClassName: "grid--header",
      renderCell: renderState,
    },
    {
      field: "knowledge_statement",
      headerName: "Connectivity Statement",
      sortable: false,
      flex: 2,
      headerClassName: "grid--header",
      renderCell: renderTitle,
    },
  ];
  const resultStr = totalResults != 1 ? "Results" : "Result";
  return (
    <Box
      sx={{
        flexGrow: 1,
        height: "calc(100vh - 125px)",
        "& .grid--header": {
          fontSize: "1em",
        },
      }}
    >
      <Typography sx={{ paddingLeft: "1em", paddingBottom: "1em" }}>
        {totalResults} {resultStr}
      </Typography>
      <DataGrid
        sx={{ height: "calc(100% - 2em)" }}
        rows={rows}
        columns={columns}
        getRowHeight={() => "auto"}
        pageSize={duplicatesRowsPerPage}
        paginationMode="server"
        sortingMode="server"
        rowCount={totalResults}
        onPageChange={handlePageChange}
        onSortModelChange={handleSortModelChange}
        rowsPerPageOptions={[duplicatesRowsPerPage]}
        page={currentPage}
        disableColumnMenu
        components={{
          Pagination: CustomPagination,
        }}
      />
    </Box>
  );
}
