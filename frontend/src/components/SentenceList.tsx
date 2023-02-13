import React, { useEffect, useState } from "react";
import { useAppSelector, useAppDispatch } from "../redux/hooks";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import {
  DataGrid,
  GridRowsProp,
  GridColDef,
  GridEventListener,
} from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import FilterListIcon from "@mui/icons-material/FilterList";

import { useNavigate } from "react-router-dom";
import { useGutters } from "../styles/styles";
import { mapSortingModel } from "../helpers/helpers";
import Header from "./Header";
import Searchbar from "./Searchbar";
import FilterDrawer from "./Filters/FilterDrawer";
import { setFilters, setIndex, setSorting } from "../redux/sentenceSlice";
import { Sentence } from "../apiclient/backend";
import sentenceService from "../services/SentenceService";

type criteria =
  | ("pmid" | "-pmid" | "last_edited" | "-last_edited")[]
  | undefined;

const toolbarStyle = {
  background: "#fff",
  padding: 2,
  borderRadius: "12px 12px 0 0",
  border: "1px solid #EAECF0",
};

const SentenceList = () => {
  const [sentenceList, setSentenceList] = useState<Sentence[]>();
  const [totalResults, setTotalResults] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const queryOptions = useAppSelector((state) => state.sentence.queryOptions);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const gutters = useGutters();

  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const rows: GridRowsProp =
    sentenceList?.map((sentence) => {
      const { id, pmid, title, state, modified_date, owner, tags, has_notes } =
        sentence;
      const ownerName = !owner ? "" : `${owner.first_name} ${owner.last_name}`;
      return {
        id,
        pmid,
        title,
        state,
        last_edited: modified_date,
        owner: ownerName,
        tags: tags.map((t) => t.tag),
        notes: has_notes,
      };
    }) || [];

  const columns: GridColDef[] = [
    { field: "pmid", headerName: "PMID" },
    { field: "title", headerName: "Sentence", flex: 2, sortable: false },
    { field: "state", headerName: "Status", sortable: false, flex: 1 },
    {
      field: "last_edited",
      headerName: "Last edited",
      flex: 0.5,
      valueFormatter: ({ value }) =>
        new Date(value).toLocaleString(undefined, {
          dateStyle: "long",
          timeStyle: "short",
        }),
    },
    { field: "owner", headerName: "Owner", sortable: false },
    { field: "tags", headerName: "Tags", sortable: false, flex: 1 },
    { field: "notes", headerName: "Notes", sortable: false },
  ];

  useEffect(() => {
    sentenceService.getList(queryOptions).then((res) => {
      setSentenceList(res.results);
      res.count && setTotalResults(res.count);
      setLoading(false);
    });
  }, [queryOptions]);

  const currentPage = (queryOptions.index || 0) / queryOptions.limit;

  const handlePageChange = (newPage: number) => {
    const index = newPage * queryOptions.limit;
    dispatch(setIndex(index));
  };

  const handleRowClick: GridEventListener<"rowClick"> = (params) => {
    navigate(`sentence/${params.row.id}`);
  };

  const handleSortModelChange = (model: any) => {
    let ordering: criteria;
    if (model.length === 0) {
      ordering = undefined;
    } else {
      const { field, sort } = model[0];
      const sortingCriteria = `${field} ${sort}`;
      if (sortingCriteria === "pmid asc") {
        ordering = ["pmid"];
      } else if (sortingCriteria === "pmid desc") {
        ordering = ["-pmid"];
      } else if (sortingCriteria === "last_edited asc") {
        ordering = ["last_edited"];
      } else if (sortingCriteria === "last_edited desc") {
        ordering = ["-last_edited"];
      } else {
        ordering = undefined;
      }
    }
    dispatch(setSorting(ordering));
  };

  const handleClearFilter = () => {
    dispatch(setFilters({ stateFilter: undefined, tagFilter: undefined }));
  };

  return (
    <Box sx={gutters} p={6} justifyContent="center">
      <Header
        title="Sentences List"
        caption={`${totalResults} sentences in total`}
        actions={[{ label: "Add a record", icon: AddIcon }]}
      />
      <Grid
        container
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        sx={toolbarStyle}
      >
        <Grid item xs={3}>
          <Searchbar queryOptions={queryOptions} />
        </Grid>
        <Grid item>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => setIsFilterDrawerOpen(true)}
            endIcon={<FilterListIcon />}
          >
            Filters
          </Button>
          <Drawer
            anchor="right"
            open={isFilterDrawerOpen}
            onClose={(e, r) => setIsFilterDrawerOpen(false)}
            ModalProps={{ sx: { zIndex: 1300 } }}
          >
            <FilterDrawer
              toggleDrawer={setIsFilterDrawerOpen}
              queryOptions={queryOptions}
              entity="sentence"
            />
          </Drawer>
          {(queryOptions.stateFilter || queryOptions.tagFilter) && (
            <Button onClick={handleClearFilter}>Clear Filter</Button>
          )}
        </Grid>
      </Grid>
      <Box flexGrow={1} height="calc(100vh - 325px)">
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
        />
      </Box>
    </Box>
  );
};

export default SentenceList;
