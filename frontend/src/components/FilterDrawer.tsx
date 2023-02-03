import React, { useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { userProfile } from "../services/UserService";
import ControlledCheckbox from "./ControlledCheckbox";
import { tags } from "../services/TagService";
import { mapCheckboxInfo } from "../helpers/helpers";

const FilterDrawer = (props: any) => {
  const { toggleDrawer, handleFilter, activeFilter } = props;

  const isTriageOperator = userProfile.getProfile().is_triage_operator;
  const tagList = tags.getTagList();
  const noStateFilter = {
    compose_later: false,
    compose_now: false,
    duplicate: false,
    open: false,
    excluded: false,
    to_be_reviewed: false,
  };

  const noTagsFilter = () => {
    let initialTags = {};
    for (const i of tagList) {
      initialTags = {
        ...initialTags,
        [i.id]: false,
      };
    }
    return initialTags;
  };

  const setInitialFilters = () => {
    let initialStates: any = noStateFilter;
    for (const i of activeFilter.states) {
      initialStates = {
        ...initialStates,
        [i]: true,
      };
    }
    let initialTags: any = noTagsFilter();
    for (const i of activeFilter.tags) {
      initialTags = {
        ...initialTags,
        [i]: true,
      };
    }
    return { states: initialStates, tags: initialTags };
  };
  const [selectedFilters, setSelectedFilters] = useState(setInitialFilters());

  const statesData = [
    { name: "open", label: "Open", checked: selectedFilters.states.open },
    {
      name: "compose_now",
      label: "Compose now",
      checked: selectedFilters.states.compose_now,
    },
    {
      name: "compose_later",
      label: "Compose later",
      checked: selectedFilters.states.compose_later,
    },
    {
      name: "duplicate",
      label: "Duplicate",
      checked: selectedFilters.states.duplicate,
    },
    {
      name: "excluded",
      label: "Excluded",
      checked: selectedFilters.states.excluded,
    },
    {
      name: "to_be_reviewed",
      label: "To be reviewed",
      checked: selectedFilters.states.to_be_reviewed,
    },
  ];

  const tagsData = mapCheckboxInfo(tagList, selectedFilters);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    filterBy: keyof typeof selectedFilters
  ) => {
    setSelectedFilters({
      ...selectedFilters,
      [filterBy]: {
        ...selectedFilters[filterBy],
        [event.target.name]: event.target.checked,
      },
    });
  };

  const handleChangeTagSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange(e, "tags");
  };

  const handleChangeStatesSelection = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    handleChange(e, "states");
  };

  const handleClearFilter = () => {
    setSelectedFilters({ states: noStateFilter, tags: noTagsFilter() });
  };

  const handleApplyFilter = () => {
    let statesFilter: string[] = [];
    let i: keyof typeof selectedFilters.states;
    for (i in selectedFilters.states) {
      selectedFilters.states[i] && statesFilter.push(i);
    }
    let tagsFilter: number[] = [];
    let j: keyof typeof selectedFilters.tags;
    for (j in selectedFilters.tags) {
      selectedFilters.tags[j] && tagsFilter.push(Number(j));
    }
    handleFilter(statesFilter, tagsFilter);
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
      <Stack spacing={3} p={3}>
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
          <Typography>
            Apply filters to the{" "}
            {isTriageOperator ? "sentences " : "statements "}
            list
          </Typography>
        </Box>
        <Box>
          <Typography variant="subtitle1" color="#344054">
            Status
          </Typography>
          <ControlledCheckbox
            data={statesData}
            handleChange={handleChangeStatesSelection}
          />
        </Box>
        <Box>
          <Typography variant="subtitle1" color="#344054">
            Tags
          </Typography>
          <ControlledCheckbox
            data={tagsData}
            handleChange={handleChangeTagSelection}
          />
        </Box>
      </Stack>
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
