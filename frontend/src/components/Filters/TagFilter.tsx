import React from "react";
import {Autocomplete, Chip, Stack, Typography} from "@mui/material";
import { tags } from "../../services/TagService";
import TextField from "@mui/material/TextField";
import {vars} from "../../theme/variables";
import IconButton from "@mui/material/IconButton";
import ClearOutlinedIcon from "@mui/icons-material/ClearOutlined";

const TagFilter = (props: any) => {
  const { selectedTags, setSelectedTags } = props;
  const tagList = tags.getTagList();
  
  const handleChange = (event: any, newValue: any[]) => {
    const newSelectedTags = tagList.reduce((acc: any, tag) => {
      acc[tag.id] = newValue.some((item) => item.id === tag.id);
      return acc;
    }, {});
    setSelectedTags(newSelectedTags);
  };


  return (
    <Stack spacing={2}>
      <Typography variant="subtitle1" color="#344054">
        Tags
      </Typography>
      <Autocomplete
        multiple
        options={tagList}
        getOptionLabel={(option) => option.tag}
        value={tagList.filter((tag) => selectedTags[tag.id])}
        onChange={handleChange}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => (
            <Chip
              variant="outlined"
              label={option.tag}
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
        renderInput={(params) => <TextField {...params} variant="outlined" placeholder="Select Tags" sx={{
          "label + &": {
            marginTop: 4,
          },
          "& .MuiOutlinedInput-notchedOutline": {
            border: 0,
          },
        }} />}
      />
    </Stack>
  );
};

export default TagFilter;
