import React from "react";

import Checkbox from "@mui/material/Checkbox";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";

const ControlledCheckbox = (props: any) => {
  const { data, handleChange } = props;
  return (
    <FormControl>
      <FormGroup>
        {data.map((s: any) => (
          <FormControlLabel
            key={s.name}
            label={s.label}
            control={
              <Checkbox
                key={s.name}
                checked={s.checked}
                onChange={handleChange}
                name={s.name.toString()}
              />
            }
          />
        ))}
      </FormGroup>
    </FormControl>
  );
};

export default ControlledCheckbox;
