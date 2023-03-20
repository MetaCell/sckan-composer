import {useEffect, useState} from "react";
import * as React from "react";
import {Autocomplete, debounce, styled} from "@mui/material";
import {SEARCH_DEBOUNCE} from "../settings";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import TextField from "@mui/material/TextField";
import InputLabel from "@mui/material/InputLabel";
import Typography from "@mui/material/Typography";
import FormControl from "@mui/material/FormControl";

const StyledAutoComplete = styled(Autocomplete)(({ theme }) => ({
  'label + &': {
    marginTop: theme.spacing(4),
  },
  "&.Mui-focused .MuiOutlinedInput-root":{
    border: "1px solid #8DB2EE",
    boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.05), 0px 0px 0px 4px #CEDDED'
  }
}));

export default function AutoComplete({placeholder, value, setValue, fetch, noOptionsText}: any) {
    const [inputValue, setInputValue] = useState<string>("")
    const [options, setOptions] = useState<readonly any[]>([]);


    const handleInputChange = (inputValue: string) => {
        setInputValue(inputValue)
    }

    const fetchEntities = React.useMemo(
        () =>
            debounce(
                () => {
                    fetch(inputValue).then((res: { data: any; }) => {
                        const {data} = res
                        const {results} = data
                        let entities = results
                        if (!entities) {
                            entities = []
                        }
                        setOptions(entities)
                    })
                }, SEARCH_DEBOUNCE,
            ),
        [inputValue],
    );


    useEffect(() => {
        fetchEntities()
    }, [inputValue, fetchEntities])

    return (
      <FormControl variant="standard">
        <StyledAutoComplete
          id='custom-AutoComplete'
            fullWidth
            popupIcon={<ExpandMoreIcon/>}
            getOptionLabel={(option: any) =>
                typeof option === 'string' ? option : option.name
            }
            isOptionEqualToValue={(option: any, value: any) => option.name === value.name}
            filterOptions={(x) => x}
            options={options}
            autoComplete
            includeInputInList
            filterSelectedOptions
            defaultValue={null}
            value={value || null}
            noOptionsText={noOptionsText}
            onChange={(event: any, newValue: any | null) => {
                setOptions(newValue ? [newValue, ...options] : options);
                setValue(newValue)
            }}
            onInputChange={(e, v) => handleInputChange(v)}
            renderInput={(params) => (
                <TextField {...params} placeholder={placeholder} fullWidth/>
            )}
        />
      </FormControl>
    );
}
