import React, {useState} from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import {tags} from "../../services/TagService";
import {mapStateFilterSelectionToCheckbox, mapTagFilterSelectionToCheckbox,} from "../../helpers/helpers";
import {useAppDispatch} from "../../redux/hooks";
import {
  ComposerConnectivityStatementListStateEnum as statementStates,
  ComposerSentenceListStateEnum as sentenceStates,
} from "../../apiclient/backend/api";
import {setFilters as setSentenceFilters} from "../../redux/sentenceSlice";
import {setFilters as setStatementFilters} from "../../redux/statementSlice";
import StateFilter from "./StateFilter";
import TagFilter from "./TagFilter";
import HasStatementBeenExportedFilter from "./HasStatementBeenExportedFilter";
import { ENTITY_TYPES, SENTENCE_STATE_ORDER, STATEMENT_STATE_ORDER } from "../../helpers/settings";
import PopulationSetFilter from "./PopulationSetFilter";
import {vars} from "../../theme/variables";

const {Draft, ...statementStatesExDraft } = statementStates

const FilterDrawer = (props: any) => {
  const { toggleDrawer, queryOptions, entity } = props;

  const { stateFilter, tagFilter, populationSetFilter, hasStatementBeenExportedFilter } = queryOptions;
  const dispatch = useAppDispatch();

  const tagList = tags.getTagList();


  const setInitialStateSelection = (currentSelection: any) => {
    const sortStates = (states: Record<string, boolean>, order: string[]) => {
      return order.reduce((acc, key) => {
        acc[key] = states.hasOwnProperty(key) ? states[key] : false;
        return acc;
      }, {} as Record<string, boolean>);
    };

    if (entity === ENTITY_TYPES.SENTENCE) {
      return sortStates(
        mapStateFilterSelectionToCheckbox(sentenceStates, currentSelection),
        SENTENCE_STATE_ORDER
      );
    } else if (entity === ENTITY_TYPES.STATEMENT) {
      return sortStates(
        mapStateFilterSelectionToCheckbox(statementStatesExDraft, currentSelection),
        STATEMENT_STATE_ORDER
      );
    }
  };

  const [selectedStates, setSelectedStates] = useState(
    setInitialStateSelection(stateFilter)
  );

  const [hasCSBeenExportedChecked, setHasCSBeenExportedChecked] = useState(
    hasStatementBeenExportedFilter ? true : false
  );

  const [selectedTags, setSelectedTags] = useState(
    mapTagFilterSelectionToCheckbox(tagList, tagFilter)
  );

  const [selectedPopulations, setSelectedPopulations] = useState(
    populationSetFilter
  );


  const handleClearFilter = () => {
    setSelectedStates(setInitialStateSelection(undefined));
    setSelectedTags(mapTagFilterSelectionToCheckbox(tagList, undefined));
    setHasCSBeenExportedChecked(false);
    setSelectedPopulations(undefined);
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
    const hasStatementBeenExportedFilter = hasCSBeenExportedChecked ? true : false;
    const populationSetFilter = mapObjToArray(selectedPopulations);

    entity === ENTITY_TYPES.SENTENCE &&
      dispatch(setSentenceFilters({ stateFilter, tagFilter, populationSetFilter }));
    entity === ENTITY_TYPES.STATEMENT &&
      dispatch(setStatementFilters({ stateFilter, tagFilter, populationSetFilter, hasStatementBeenExportedFilter }));
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
        <PopulationSetFilter
          selectedPopulations={selectedPopulations}
          setSelectedPopulations={setSelectedPopulations}
        />
        {
          entity === ENTITY_TYPES.STATEMENT &&
          <HasStatementBeenExportedFilter
            hasStatementBeenExported={hasCSBeenExportedChecked}
            setHasStatementBeenExported={setHasCSBeenExportedChecked}
          />
        }

      </Stack>
      {/*<Divider />*/}
      <Box
        sx={{
          position: "sticky",
          bottom: 0,
          background: "white",
          boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
          borderTop: `1px solid ${vars.gray200}`,
          px: 3,
          py: 2,
          textAlign: "right",
          zIndex: 10,
        }}
      >
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
