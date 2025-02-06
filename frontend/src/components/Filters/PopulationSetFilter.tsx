import React from "react";
import { Autocomplete, Chip, Stack, Typography } from "@mui/material";
import TextField from "@mui/material/TextField";
import { vars } from "../../theme/variables";
import IconButton from "@mui/material/IconButton";
import ClearOutlinedIcon from "@mui/icons-material/ClearOutlined";

const populationSetList = [
  { id: "mmset1", label: "mmset1" },
  { id: "mmset2", label: "mmset2" },
  { id: "mmset3", label: "mmset3" },
  { id: "mmset4", label: "mmset4" },
  { id: "brain", label: "brain" },
  { id: "vagus", label: "vagus" },
  { id: "keast", label: "keast" },
  { id: "liver", label: "liver" },
  { id: "mmset6", label: "mmset6" },
];

const PopulationSetFilter = (props: any) => {
  const { selectedPopulations, setSelectedPopulations } = props;
  
  const handleChange = (event: any, newValue: any[]) => {
    const newSelectedPopulations = populationSetList.reduce((acc: any, option) => {
      acc[option.id] = newValue.some((item) => item.id === option.id);
      return acc;
    }, {});
    setSelectedPopulations(newSelectedPopulations);
  };
  
  return (
    <Stack spacing={2}>
      <Typography variant="subtitle1" color="#344054">
        Population Sets
      </Typography>
      <Autocomplete
        multiple
        options={populationSetList}
        getOptionLabel={(option) => option.label}
        value={populationSetList.filter((option) => selectedPopulations && selectedPopulations[option.id])}
        onChange={handleChange}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => (
            <Chip
              variant="outlined"
              label={option.label}
              {...getTagProps({ index })}
              key={option.id}
              deleteIcon={
                <IconButton size="small">
                  <ClearOutlinedIcon sx={{ fontSize: 16, color: vars.grey400 }} />
                </IconButton>
              }
              sx={{
                border: `1px solid ${vars.buttonOutlinedBorderColor}`,
                borderRadius: "6px",
                margin: "4px",
                "& .MuiChip-label": {
                  color: vars.buttonOutlinedColor,
                  fontSize: "14px",
                },
                "& .MuiChip-deleteIcon": {
                  color: vars.grey400,
                  fontSize: "14px",
                },
              }}
            />
          ))
        }
        renderInput={(params) => (
          <TextField
            {...params}
            variant="outlined"
            placeholder="Select Population Sets"
            sx={{
              "label + &": {
                marginTop: 4,
              },
              "& .MuiOutlinedInput-notchedOutline": {
                border: 0,
              },
            }}
          />
        )}
      />
    </Stack>
  );
};

export default PopulationSetFilter;
