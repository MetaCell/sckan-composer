import React, {useEffect, useState} from "react";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import {Autocomplete, Box, styled} from "@mui/material";
import Chip from "@mui/material/Chip";
import ClearOutlinedIcon from "@mui/icons-material/ClearOutlined";
import { vars } from "../../theme/variables";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import {useAppSelector} from "../../redux/hooks";
import connectivityStatementService from "../../services/StatementService";
import Checkbox from '@mui/material/Checkbox';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import {QueryParams} from "../../redux/statementSlice";

const { buttonOutlinedColor, grey400, buttonOutlinedBorderColor, titleFontColor } = vars;

const StyledInput = styled(TextField)(({ theme }) => ({
  "label + &": {
    marginTop: theme.spacing(4),
  },
  "& .MuiOutlinedInput-notchedOutline": {
    border: 0,
  },
}));

type Option = {
  id: number | null;
  label: string | undefined;
  sentence_id: number;
  relation: string;
};

export const CustomAutocompleteForwardConnection = ({
  placeholder,
  options: {
    removeChip,
    label,
    disabled,
    statement,
    service,
    setter
  },
}: any) => {
  const [isInputFocused, setInputFocus] = useState(false);
  const [statementLists, setStatementLists] = useState({
    sameSentence: [],
    restSentence: [],
  });
  const [samSentenceQueryOptions, setSamSentenceQueryOptions] = useState(useAppSelector((state) => state.statement.queryOptions));
  const [restSentenceQueryOptions, setRestSentenceQueryOptions] = useState(useAppSelector((state) => state.statement.queryOptions));
  const queryOptions = useAppSelector((state) => state.statement.queryOptions);
  
  const onChange = (e: any, value: any) => {
    const formData = {
      ...statement,
      forward_connection: value.map((row: any) => row.id)
    }
    
    // service
    //   .save(formData)
    //   .then((newData: any) => {
    //     setter && setter(newData);
    //   })
    //   .catch((error: any) => {
    //     // todo: handle errors here
    //     console.log("Something went wrong");
    //   })
  };
  
  const fetchStatementList = (queryOptions: QueryParams, sentenceType: string) => {
    connectivityStatementService.getList(queryOptions).then((res) => {
      if (res.results) {
        const statements = res.results.map((item) => ({
          id: item.id,
          label: item.knowledge_statement,
          sentence_id: item.sentence_id,
          relation:
            sentenceType === "same"
              ? "Derived from the same statement"
              : "Other",
        }));
        
        setStatementLists((prevLists) => ({
          ...prevLists,
          [`${sentenceType}Sentence`]: statements,
        }));
      }
    });
  };
  
  useEffect(() => {
    setSamSentenceQueryOptions({ ...queryOptions, sentenceId: statement.sentence_id });
    setRestSentenceQueryOptions({ ...queryOptions, sentenceId: -statement.sentence_id});
  }, [queryOptions, statement]);
  
  useEffect(() => {
    fetchStatementList(samSentenceQueryOptions, "same");
    fetchStatementList(restSentenceQueryOptions, "rest");
  }, [queryOptions, restSentenceQueryOptions, samSentenceQueryOptions]);
  
  
  const options = [...statementLists.sameSentence, ...statementLists.restSentence];

  return (
    <FormControl variant="standard">
        <Typography variant="h6" fontWeight={500} marginBottom={2} color={titleFontColor}>
          {label}
        </Typography>
      <Autocomplete
        multiple
        disableClearable
        disabled={disabled}
        options={options}
        freeSolo
        onChange={(e, value) => onChange(e, value)}
        groupBy={(option: Option) => option.relation}
        renderOption={(props, option, { selected }) => (
          <li {...props}>
            <Checkbox
              icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
              checkedIcon={<CheckBoxIcon fontSize="small" />}
              style={{ marginRight: 8 }}
              checked={selected}
            />
            {option.label}
          </li>
        )}
        renderInput={(params) => (
          <StyledInput
            {...params}
            disabled={disabled}
            id="custom-input"
            placeholder={placeholder}
            onFocus={() => setInputFocus(true)}
            onBlur={() => setInputFocus(false)}
            InputProps={{
                ...params.InputProps,
                endAdornment: (
                    <>
                        {isInputFocused ? (
                            <CloseIcon
                                color="action"
                                fontSize="small"
                                sx={{ cursor: "pointer", mr: 0.6 }}
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                }}
                            />
                        ) : null}
                        {params.InputProps.endAdornment}
                    </>
                ),
            }}
          />
        )}
      />
    </FormControl>
  );
};
