import React from "react";

import Checkbox from "@mui/material/Checkbox";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import StateChip from "./StateChip";
import Tag from "./Tag";
import { CheckedItemIcon, UncheckedItemIcon } from "../icons";

const ControlledCheckbox = (props: any) => {
  const { data, handleChange, type } = props;

  return (
    <FormControl>
      <FormGroup>
        {data.map((s: any) => (
          <FormControlLabel
            key={s.name}
            label={
              type === "state" ? (
                <StateChip key={s.name} value={s.name} />
              ) : (
                <Tag key={s.name} label={s.label} />
              )
            }
            control={
              <Checkbox
                key={s.name}
                checked={s.checked}
                onChange={handleChange}
                name={s.name.toString()}
                size="small"
                checkedIcon={<CheckedItemIcon />}
                icon={<UncheckedItemIcon />}
              />
            }
          />
        ))}
      </FormGroup>
    </FormControl>
  );
};

export default ControlledCheckbox;
