import React, { useRef, useEffect } from "react";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import SearchIcon from "@mui/icons-material/Search";
import { useDebouncedCallback } from "use-debounce";
import { SEARCH_DEBOUNCE } from "../settings";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { setTitleQuery } from "../redux/sentenceSlice";

const Searchbar = (props: any) => {
  const { queryOptions } = props;
  const inputRef = useRef<HTMLInputElement>(null);
  const dispatch = useAppDispatch();

  const handleInputChange = (e: any) => {
    dispatch(setTitleQuery(e.target.value));
  };

  const debouncedChangeHandler = useDebouncedCallback(
    (e) => handleInputChange(e),
    SEARCH_DEBOUNCE
  );

  const onEscapeHandler = (e: any) => {
    if (e.key === "Escape" && inputRef.current) {
      inputRef.current.value = "";
      dispatch(setTitleQuery(undefined));
    }
  };

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
  }, [queryOptions]);

  return (
    <Box flexGrow={1} minWidth="200px">
      <TextField
        inputRef={inputRef}
        onChange={debouncedChangeHandler}
        variant="outlined"
        placeholder="Search for Sentences"
        size="small"
        defaultValue={queryOptions.title}
        fullWidth
        InputProps={{
          startAdornment: (
            <SearchIcon color="primary" fontSize="small" sx={{ mr: 0.6 }} />
          ),
        }}
      />
    </Box>
  );
};

export default Searchbar;
