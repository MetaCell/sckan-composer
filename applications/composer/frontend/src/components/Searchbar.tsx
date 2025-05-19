import React, {useRef, useEffect, useState, useCallback} from "react";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import {useDebouncedCallback} from "use-debounce";
import {SEARCH_DEBOUNCE} from "../settings";
import {useAppDispatch} from "../redux/hooks";
import {setTitleQuery} from "../redux/sentenceSlice";
import {setKnowledgeStatementQuery} from "../redux/statementSlice";

const Searchbar = (props: any) => {
  const {queryOptions, entityType} = props;
  const inputRef = useRef<HTMLInputElement>(null);
  const dispatch = useAppDispatch();
  const [isFocused, setIsFocused] = useState(false);


  const placeholder = entityType === 'sentence' ? 'Search for Sentences' : 'Search for Knowledge Statements'

  const handleInputChange = (e: any) => {
    entityType === "sentence" && dispatch(setTitleQuery(e.target.value));
    entityType === "statement" &&
    dispatch(setKnowledgeStatementQuery(e.target.value));
  };

  const debouncedChangeHandler = useDebouncedCallback(
    (e) => handleInputChange(e),
    SEARCH_DEBOUNCE
  );

  const handleClear = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    if (entityType === "sentence") {
      dispatch(setTitleQuery(undefined));
    } else if (entityType === "statement") {
      dispatch(setKnowledgeStatementQuery(undefined));
    }
  }, [inputRef, entityType, dispatch]);

  const onEscapeHandler = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape" && inputRef.current) {
      handleClear();
    }
  }, [inputRef, handleClear]);

  useEffect(() => {
    return () => {
      debouncedChangeHandler.cancel();
    };
  });

  useEffect(() => {
    document.addEventListener("keydown", onEscapeHandler, false);

    return () => {
      document.removeEventListener("keydown", onEscapeHandler, false);
    };
  }, [queryOptions, onEscapeHandler]);

  return (
    <Box flexGrow={1} minWidth="200px">
      <TextField
        inputRef={inputRef}
        onChange={debouncedChangeHandler}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        variant="outlined"
        placeholder={placeholder}
        size="small"
        defaultValue={
          entityType === "sentence"
            ? queryOptions.title
            : queryOptions.knowledgeStatement
        }
        fullWidth
        InputProps={{
          startAdornment: (
            <SearchIcon color="primary" fontSize="small" sx={{mr: 0.6}}/>
          ),
          endAdornment: isFocused ? (
            <CloseIcon
              color="action"
              fontSize="small"
              sx={{cursor: "pointer", mr: 0.6}}
              onMouseDown={(e) => {
                e.preventDefault();
                handleClear();
              }}
            />
          ) : null,
        }}
      />
    </Box>
  );
};

export default Searchbar;
