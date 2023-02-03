import React, { useMemo, useRef, useEffect } from "react";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import SearchIcon from "@mui/icons-material/Search";
import { debounce } from "lodash";

const Searchbar = (props: any) => {
  const { setSearchQuery } = props;

  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: any) => {
    setSearchQuery(e.target.value);
  };

  const debouncedChangeHandler = useMemo(() => {
    return debounce(handleInputChange, 300);
  }, []);

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
        placeholder="Search for NLP Sentences"
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
