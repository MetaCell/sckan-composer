import React, { useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import { tags } from "../../services/TagService";
import {
  mapStateFilterSelectionToCheckbox,
  mapTagFilterSelectionToCheckbox,
} from "../../helpers/helpers";
import { useAppDispatch } from "../../redux/hooks";
import {
  SentenceAvailableTransitionsEnum as sentenceStates,
  ConnectivityStatementAvailableTransitionsEnum as statementStates,
} from "../../apiclient/backend";
import { setFilters as setSentenceFilters } from "../../redux/sentenceSlice";
import { setFilters as setStatementFilters } from "../../redux/statementSlice";
import StateFilter from "./StateFilter";
import TagFilter from "./TagFilter";

const FilterDrawer = (props: any) => {
  const { toggleDrawer, queryOptions, entity } = props;

  const { stateFilter, tagFilter } = queryOptions;
  const dispatch = useAppDispatch();

  const tagList = tags.getTagList();

  const setInitialStateSelection = (currentSelection: any) => {
    if (entity === "sentence") {
      return mapStateFilterSelectionToCheckbox(
        sentenceStates,
        currentSelection
      );
    } else if (entity === "statement") {
      return mapStateFilterSelectionToCheckbox(
        statementStates,
        currentSelection
      );
    }
  };

  const [selectedStates, setSelectedStates] = useState(
    setInitialStateSelection(stateFilter)
  );

  const [selectedTags, setSelectedTags] = useState(
    mapTagFilterSelectionToCheckbox(tagList, tagFilter)
  );

  const handleClearFilter = () => {
    setSelectedStates(setInitialStateSelection(undefined));
    setSelectedTags(mapTagFilterSelectionToCheckbox(tagList, undefined));
  };

  const mapObjToArray = (filterObj: any) => {
    let filterArray: any = [];
    for (let i in filterObj) {
      filterObj[i] && filterArray.push(i);
    }
    if (filterArray.length === 0) return;
    return filterArray;
  };

  const handleApplyFilter = () => {
    const stateFilter = mapObjToArray(selectedStates);
    let tagFilter = mapObjToArray(selectedTags);
    entity === "sentence" &&
      dispatch(setSentenceFilters({ stateFilter, tagFilter }));
    entity === "statement" &&
      dispatch(setStatementFilters({ stateFilter, tagFilter }));
    toggleDrawer(false);
  };

  return (
    <Box
      width={400}
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
      flexGrow={1}
      role="presentation"
    >
      <Stack spacing={3} p={3} flex={1}>
        <Box>
          <Box
            display="flex"
            alignItems="flex-end"
            justifyContent="space-between"
          >
            <Typography variant="h5">Filters</Typography>
            <IconButton onClick={() => toggleDrawer(false)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          <Typography>Apply filters to the {entity}s list</Typography>
        </Box>
        <StateFilter
          selectedStates={selectedStates}
          setSelectedStates={setSelectedStates}
          entity={entity}
        />
        <TagFilter
          selectedTags={selectedTags}
          setSelectedTags={setSelectedTags}
        />
      </Stack>
      <Divider />
      <Box px={3} py={2} textAlign="right">
        <Button
          variant="outlined"
          color="secondary"
          sx={{ mr: 1.5 }}
          onClick={handleClearFilter}
        >
          Cancel
        </Button>
        <Button variant="contained" onClick={handleApplyFilter}>
          Apply
        </Button>
      </Box>
    </Box>
  );
};

export default FilterDrawer;
