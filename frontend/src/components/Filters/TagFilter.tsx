import React from "react";
import { Stack, Typography } from "@mui/material";
import ControlledCheckbox from "../Widgets/ControlledCheckbox";
import { tags } from "../../services/TagService";

const TagFilter = (props: any) => {
  const { selectedTags, setSelectedTags } = props;
  const tagList = tags.getTagList();

  const tagsCheckboxData = tagList.map((i) => ({
    name: i.id,
    label: i.tag,
    checked: selectedTags[i.id],
  }));

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedTags((prev: any) => ({
      ...prev,
      [event.target.name]: event.target.checked,
    }));
  };

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle1" color="#344054">
        Tags
      </Typography>
      <ControlledCheckbox data={tagsCheckboxData} handleChange={handleChange} />
    </Stack>
  );
};

export default TagFilter;
