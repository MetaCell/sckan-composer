import React, { useEffect, useState } from "react";
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
import { PaginatedSentenceList } from "../apiclient/backend";
import { composerApi as api } from "../services/apis";
import { useGutters } from "../styles/styles";
import Header from "./Header";
import Searchbar from "./Searchbar";
import FilterDrawer from "./FilterDrawer";

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
  const [sentenceList, setSentenceList] =
    useState<PaginatedSentenceList>();
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [sorting, setSorting] = useState<criteria>();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState({
    states: [],
    tags: [],
  });

  const rowsPerPage = 10;

  const navigate = useNavigate();

  const gutters = useGutters();

  const rows: GridRowsProp =
    sentenceList?.results?.map((sentence) => {
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

  const fetchSentenceList = (
    ordering?: criteria,
    index?: number,
    stateFilter?: any,
    tagFilter?: any
  ) => {
    api
      .composerSentenceList(
        rowsPerPage,
        undefined,
        index,
        ordering || sorting,
        stateFilter || activeFilter.states,
        tagFilter || activeFilter.tags,
        searchQuery
      )
      .then((res) => {
        setSentenceList(res.data);
        setTotalResults(res.data.count || 0);
        stateFilter &&
          setActiveFilter((prev) => ({ ...prev, states: stateFilter }));
        tagFilter && setActiveFilter((prev) => ({ ...prev, tags: tagFilter }));
        setSorting(ordering);
      });
  };

  useEffect(() => {
    fetchSentenceList(sorting, undefined);
  }, [searchQuery]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    const index = newPage * rowsPerPage;
    fetchSentenceList(sorting, index);
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
    fetchSentenceList(ordering);
    setCurrentPage(0);
  };

  const handleFilter = (stateFilter = [], tagFilter = []) => {
    fetchSentenceList(undefined, undefined, stateFilter, tagFilter);
  };

  const handleClearFilter = () => {
    fetchSentenceList(undefined, undefined, [], []);
    setActiveFilter({
      states: [],
      tags: [],
    });
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
          <Searchbar setSearchQuery={setSearchQuery} />
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
              handleFilter={handleFilter}
              activeFilter={activeFilter}
            />
          </Drawer>
          {(activeFilter.states.length !== 0 ||
            activeFilter.tags.length !== 0) && (
            <Button onClick={handleClearFilter}>Clear Filter</Button>
          )}
        </Grid>
      </Grid>
      <Box flexGrow={1} height="calc(100vh - 325px)">
        <DataGrid
          rows={rows}
          columns={columns}
          getRowHeight={() => "auto"}
          pageSize={rowsPerPage}
          paginationMode="server"
          sortingMode="server"
          rowCount={totalResults}
          onPageChange={handlePageChange}
          onRowClick={handleRowClick}
          onSortModelChange={handleSortModelChange}
          rowsPerPageOptions={[rowsPerPage]}
          page={currentPage}
          disableColumnMenu
        />
      </Box>
    </Box>
  );
};

export default SentenceList;
