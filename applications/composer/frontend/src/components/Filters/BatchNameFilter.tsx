import React from "react";
import { Autocomplete, Chip, Stack, Typography } from "@mui/material";
import TextField from "@mui/material/TextField";
import { vars } from "../../theme/variables";
import IconButton from "@mui/material/IconButton";
import ClearOutlinedIcon from "@mui/icons-material/ClearOutlined";

interface BatchNameFilterProps {
  batchNames: string[];
  selectedBatches: Record<string, boolean>;
  setSelectedBatches: (batches: Record<string, boolean>) => void;
}

const BatchNameFilter: React.FC<BatchNameFilterProps> = ({
  batchNames,
  selectedBatches,
  setSelectedBatches,
}) => {
  const batchOptions = batchNames.map((name) => ({ id: name, label: name }));

  const handleChange = (event: any, newValue: any[]) => {
    const newSelectedBatches = batchOptions.reduce((acc: any, batch) => {
      acc[batch.id] = newValue.some((item) => item.id === batch.id);
      return acc;
    }, {});
    setSelectedBatches(newSelectedBatches);
  };

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle1" color="#344054">
        Batch Names
      </Typography>
      <Autocomplete
        multiple
        options={batchOptions}
        getOptionLabel={(option) => option.label}
        value={batchOptions.filter((batch) => selectedBatches[batch.id])}
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
            placeholder="Select Batch Names"
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

export default BatchNameFilter;
