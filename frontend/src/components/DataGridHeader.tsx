import React, { useState } from "react";
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

const toolbarStyle = {
  background: "#fff",
  padding: 2,
  borderRadius: "12px 12px 0 0",
  border: "1px solid #EAECF0",
};

interface DataGridHeaderProps {
  queryOptions: SentenceQueryParams | StatementQueryParams;
  entityType: "sentence" | "statement";
}

const DataGridHeader = (props: DataGridHeaderProps) => {
  const { queryOptions, entityType } = props;

  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const dispatch = useAppDispatch();

  const handleClearFilter = () => {
    const noFilters = { stateFilter: undefined, tagFilter: undefined };
    entityType === "sentence"
      ? dispatch(setSentenceFilters(noFilters))
      : dispatch(setStatementFilters(noFilters));
  };

  return (
    <Grid
      container
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      sx={toolbarStyle}
    >
      <Grid item xs={3}>
        <Searchbar queryOptions={queryOptions} entityType={entityType} />
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
            entity={entityType}
          />
        </Drawer>
        {(queryOptions.stateFilter || queryOptions.tagFilter) && (
          <Button onClick={handleClearFilter}>Clear Filter</Button>
        )}
      </Grid>
    </Grid>
  );
};

export default DataGridHeader;
