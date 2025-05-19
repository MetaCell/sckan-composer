import React from "react";
import { Autocomplete, Chip, Stack, Typography } from "@mui/material";
import TextField from "@mui/material/TextField";
import { vars } from "../../theme/variables";
import IconButton from "@mui/material/IconButton";
import ClearOutlinedIcon from "@mui/icons-material/ClearOutlined";
import { populations } from "../../services/PopulationService";


const PopulationSetFilter = (props: any) => {
  const { selectedPopulations, setSelectedPopulations } = props;
  const populationSetList = populations.getPopulations()
  
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
        getOptionLabel={(option) => option.name}
        value={populationSetList.filter((option) => selectedPopulations && selectedPopulations[option.id])}
        onChange={handleChange}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => (
            <Chip
              variant="outlined"
              label={option.name}
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
