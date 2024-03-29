import { useEffect, useState } from "react";
import * as React from "react";
import { Autocomplete, debounce, styled } from "@mui/material";
import { SEARCH_DEBOUNCE } from "../settings";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import TextField from "@mui/material/TextField";
import InputLabel from "@mui/material/InputLabel";
import Typography from "@mui/material/Typography";
import FormControl from "@mui/material/FormControl";

const StyledAutoComplete = styled(Autocomplete)(({ theme }) => ({
  "label + &": {
    marginTop: theme.spacing(4),
  },
  "& .MuiOutlinedInput-notchedOutline": {
    border: 0,
  },
}));

export default function AutoComplete({
  onChange,
  placeholder,
  isDisabled,
  value,
  setValue,
  fetch,
  noOptionsText,
  label,
  borderColor,
}: any) {
  const [inputValue, setInputValue] = useState<string>(value);
  const [options, setOptions] = useState<readonly any[]>([]);

  const handleInputChange = (inputValue: string) => {
    setInputValue(inputValue);
  };

  const fetchEntities = React.useMemo(
    () =>
      debounce(() => {
        fetch(inputValue).then((res: { data: any }) => {
          const { data } = res;
          const { results } = data;
          let entities = results;
          if (!entities) {
            entities = [];
          }
          setOptions(entities);
        });
      }, SEARCH_DEBOUNCE),
    [inputValue, fetch],
  );

  useEffect(() => {
    inputValue !== undefined && fetchEntities();
  }, [inputValue, fetchEntities]);

  return (
    <FormControl variant="standard" fullWidth>
      {label && (
        <InputLabel shrink htmlFor="custom-select" id="custom-select-label">
          <Typography variant="h5" fontWeight={500}>
            {label}
          </Typography>
        </InputLabel>
      )}
      <StyledAutoComplete
        sx={{
          "& .MuiFormControl-root": {
            "& .MuiInputBase-root": {
              borderColor,
            },
          },
        }}
        className="custom-AutoComplete"
        fullWidth
        popupIcon={<ExpandMoreIcon />}
        getOptionLabel={(option: any) =>
          typeof option === "string" ? option : option.name
        }
        isOptionEqualToValue={(option: any, value: any) =>
          option.name === value.name
        }
        filterOptions={(x) => x}
        options={options}
        autoComplete
        disabled={isDisabled}
        includeInputInList
        filterSelectedOptions
        defaultValue={null}
        value={value || null}
        noOptionsText={noOptionsText}
        onChange={(event: any, newValue: any | null) => {
          onChange && onChange(newValue);
          setOptions(newValue ? [newValue, ...options] : options);
          setValue(newValue);
        }}
        onInputChange={(e, v) => handleInputChange(v)}
        renderInput={(params) => (
          <TextField {...params} placeholder={placeholder} fullWidth />
        )}
      />
    </FormControl>
  );
}
