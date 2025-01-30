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
import {GridRowId} from "@mui/x-data-grid";
import Stack from "@mui/material/Stack";
import {Divider, Typography} from "@mui/material";
import IconButton from "@mui/material/IconButton";
import {AssignPopulationIcon, ChangeStatusIcon, LabelAddIcon, NoteAddIcon} from "./icons";
import AssignUser from "./TableMultiSelectActions/AssignUser";

const toolbarStyle = {
  background: "#fff",
  padding: 2,
  borderRadius: "12px 12px 0 0",
  border: "1px solid #EAECF0",
};

interface DataGridHeaderProps {
  queryOptions: SentenceQueryParams | StatementQueryParams;
  entityType: "sentence" | "statement";
  selectedRows?: GridRowId[]
}
const DataGridHeader = (props: DataGridHeaderProps) => {
  const { queryOptions, entityType, selectedRows } = props;
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
      <Grid item xs={12} md={3}>
        <Searchbar queryOptions={queryOptions} entityType={entityType} />
      </Grid>
     
      <Grid item xs={12} md={9} display='flex' alignItems='center' justifyContent='end' gap='1rem'>
        {
          selectedRows && selectedRows.length > 0 &&
          <Stack direction="row" alignItems="center" spacing={1} sx={{
            '& .MuiButtonBase-root': {
              padding: '0.125rem',
              borderRadius: '8px',
            },
            '& .MuiDivider-root': {
              width: '0.0625rem',
              height: '1.5rem',
              background: '#EAECF0',
              borderColor: '#EAECF0',
              alignSelf: 'center'
            }
          }}>
            <Typography variant="body2">
              {selectedRows.length} {entityType}{selectedRows.length > 1 ? "s" : ""} selected
            </Typography>
            <Divider flexItem />
            <AssignUser />
            <IconButton>
              <LabelAddIcon />
            </IconButton>
            <IconButton>
              <NoteAddIcon />
            </IconButton>
            <IconButton>
              <ChangeStatusIcon />
            </IconButton>
            <IconButton>
              <AssignPopulationIcon />
            </IconButton>
            <Divider flexItem />
          </Stack>
        }
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
          onClose={() => setIsFilterDrawerOpen(false)}
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
