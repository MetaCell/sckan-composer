import React from "react";
import { Stack, Typography } from "@mui/material";
import ControlledCheckbox from "../Widgets/ControlledCheckbox";

const HasStatementBeenExportedFilter = (props: any) => {
  const { hasStatementBeenExported, setHasStatementBeenExported } = props;
  const option = { id: 1, option: "Does this exist in SCKAN?" };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setHasStatementBeenExported(event.target.checked);
  };

  const optionsCheckboxData = [
    {
      name: option.id,
      label: option.option,
      checked: hasStatementBeenExported
    }
  ];

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle1" color="#344054">
        Exported data
      </Typography>
      <ControlledCheckbox data={optionsCheckboxData} handleChange={handleChange} />
    </Stack>
  );
};

export default HasStatementBeenExportedFilter;
