import React, { useRef, useEffect } from "react";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import SearchIcon from "@mui/icons-material/Search";
import {useDebouncedCallback} from "use-debounce";
import {SEARCH_DEBOUNCE} from "../settings";

const Searchbar = (props: any) => {
  const { setSearchQuery } = props;

  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: any) => {
    setSearchQuery(e.target.value);
  };

  const debouncedChangeHandler = useDebouncedCallback((e) => handleInputChange(e), SEARCH_DEBOUNCE);

  const onEscapeHandler = (e: any) => {
    if (e.key === "Escape" && inputRef.current) {
      inputRef.current.value = "";
      setSearchQuery("");
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
  }, []);

  return (
    <Box flexGrow={1} minWidth="200px">
      <TextField
        inputRef={inputRef}
        onChange={debouncedChangeHandler}
        variant="outlined"
        placeholder="Search for Sentences"
        size="small"
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
