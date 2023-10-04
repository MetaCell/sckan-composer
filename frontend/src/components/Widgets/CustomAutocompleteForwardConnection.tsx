import React, { useEffect, useState } from "react";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import { Autocomplete, Box, styled } from "@mui/material";
import Paper from "@mui/material/Paper";
import { vars } from "../../theme/variables";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import { useAppSelector } from "../../redux/hooks";
import connectivityStatementService from "../../services/StatementService";
import Checkbox from "@mui/material/Checkbox";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import Stack from "@mui/material/Stack";
import ListSubheader from "@mui/material/ListSubheader";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import PlaylistRemoveOutlinedIcon from "@mui/icons-material/PlaylistRemoveOutlined";
import PlaylistAddCheckOutlinedIcon from "@mui/icons-material/PlaylistAddCheckOutlined";
import { ConnectivityStatement } from "../../apiclient/backend";
import Chip from "@mui/material/Chip";
import ClearOutlinedIcon from "@mui/icons-material/ClearOutlined";

const { titleFontColor } = vars;

const StyledInput = styled(TextField)(({ theme }) => ({
  "label + &": {
    marginTop: theme.spacing(4),
  },
  "& .MuiOutlinedInput-notchedOutline": {
    border: 0,
  },
}));

type Option = ConnectivityStatement & {
  relation: string;
};

export const CustomAutocompleteForwardConnection = ({
  placeholder,
  options: { removeChip, label, disabled, statement, service, setter },
}: any) => {
  const [isInputFocused, setInputFocus] = useState(false);
  const [sameStatementList, setSameStatementLists] = useState<Option[]>([]);
  const [restStatementList, setRestStatementLists] = useState<Option[]>([]);
  const [hoveredOption, setHoveredOption] = useState<Option | undefined>(
    undefined,
  );
  const [selectedOptions, setSelectedOptions] = useState<Option[]>([]);

  const queryOptions = useAppSelector((state) => state.statement.queryOptions);
  const onChange = (e: any, value: any) => {
    setSelectedOptions(value);
    const formData = {
      ...statement,
      forward_connection: value,
    };
    // service
    //   .save(formData)
    //   .then((newData: any) => {
    //     setter && setter(newData);
    //   })
    //   .catch((error: any) => {
    //     // todo: handle errors here
    //     console.log("Something went wrong");
    //   });
  };

  const handleSelectAll = (group: string) => {
    if (group === "Other") {
      const newSelectedOptions = [...selectedOptions];
      restStatementList.forEach((item) => {
        if (
          !newSelectedOptions.some(
            (selectedItem) => selectedItem.id === item.id,
          )
        ) {
          newSelectedOptions.push(item);
        }
      });
      setSelectedOptions(newSelectedOptions);
    }
    if (group === "Derived from the same statement") {
      const newSelectedOptions = [...selectedOptions];
      sameStatementList.forEach((item) => {
        if (
          !newSelectedOptions.some(
            (selectedItem) => selectedItem.id === item.id,
          )
        ) {
          newSelectedOptions.push(item);
        }
      });
      setSelectedOptions(newSelectedOptions);
    }
  };

  const handleDeselectAll = (group: string) => {
    if (group === "Other") {
      const newSelectedOptions = selectedOptions.filter(
        (item) =>
          !restStatementList.some(
            (selectedItem) => selectedItem.id === item.id,
          ),
      );
      setSelectedOptions(newSelectedOptions);
    }
    if (group === "Derived from the same statement") {
      const newSelectedOptions = selectedOptions.filter(
        (item) =>
          !sameStatementList.some(
            (selectedItem) => selectedItem.id === item.id,
          ),
      );
      setSelectedOptions(newSelectedOptions);
    }
  };

  const getGroupButton = (group: string) => {
    if (group === "Derived from the same statement") {
      const allObjectsExist = sameStatementList.every((obj1) =>
        selectedOptions.some(
          (obj2) => JSON.stringify(obj1) === JSON.stringify(obj2),
        ),
      );

      return allObjectsExist ? (
        <Button
          variant="text"
          sx={{
            color: "#184EA2",
            fontSize: "0.75rem",
            fontWeight: 600,
            lineHeight: "1.125rem",
          }}
          onClick={() => handleDeselectAll(group)}
        >
          Deselect All
        </Button>
      ) : (
        <Button
          variant="text"
          sx={{
            color: "#184EA2",
            fontSize: "0.75rem",
            fontWeight: 600,
            lineHeight: "1.125rem",
          }}
          onClick={() => handleSelectAll(group)}
        >
          Select All
        </Button>
      );
    }
    if (group === "Other") {
      const allObjectsExist = restStatementList.every((obj1) =>
        selectedOptions.some(
          (obj2) => JSON.stringify(obj1) === JSON.stringify(obj2),
        ),
      );
      return allObjectsExist ? (
        <Button
          variant="text"
          sx={{
            color: "#184EA2",
            fontSize: "0.75rem",
            fontWeight: 600,
            lineHeight: "1.125rem",
          }}
          onClick={() => handleDeselectAll(group)}
        >
          Deselect All
        </Button>
      ) : (
        <Button
          variant="text"
          sx={{
            color: "#184EA2",
            fontSize: "0.75rem",
            fontWeight: 600,
            lineHeight: "1.125rem",
          }}
          onClick={() => handleSelectAll(group)}
        >
          Select All
        </Button>
      );
    }
  };

  useEffect(() => {
    connectivityStatementService
      .getList({ ...queryOptions, sentenceId: statement.sentence_id })
      .then((res) => {
        if (res.results) {
          const results = res.results.map((item) => ({
            ...item,
            relation: "Derived from the same statement",
          })) as Option[];
          setSameStatementLists(results);
        }
      });
    connectivityStatementService
      .getList({ ...queryOptions, sentenceId: -statement.sentence_id })
      .then((res) => {
        if (res.results) {
          const results = res.results.map((item) => ({
            ...item,
            relation: "Other",
          })) as Option[];
          setRestStatementLists(results);
        }
      });
  }, []);

  const options: Option[] = [
    ...(sameStatementList as Option[]),
    ...(restStatementList as Option[]),
  ];

  return (
    <FormControl variant="standard">
      <Typography
        variant="h6"
        fontWeight={500}
        marginBottom={2}
        color={titleFontColor}
      >
        {label}
      </Typography>
      <Autocomplete
        disableCloseOnSelect
        multiple
        disableClearable
        disabled={disabled}
        options={options}
        freeSolo
        onChange={(e, value) => onChange(e, value)}
        groupBy={(option: Option) => option.relation}
        value={selectedOptions}
        getOptionLabel={(option: string | Option) => {
          return typeof option === "string"
            ? option
            : (option as Option).knowledge_statement || "";
        }}
        renderTags={(value: Option[], getTagProps) =>
          value.map((option, index) => (
            <Chip
              {...getTagProps({ index })}
              deleteIcon={<ClearOutlinedIcon />}
              variant="outlined"
              label={option.knowledge_statement}
              key={option.id}
              sx={{
                borderRadius: "6px",
                margin: "4px",

                "& .MuiChip-label": {
                  fontSize: "14px",
                },
                "& .MuiChip-deleteIcon": {
                  fontSize: "14px",
                },
              }}
            />
          ))
        }
        renderGroup={(params) => (
          <li key={params.key}>
            <ListSubheader
              component="div"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography
                sx={{
                  color: "#344054",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  lineHeight: "1.125rem",
                }}
              >
                {params.group}
              </Typography>
              {getGroupButton(params.group)}
            </ListSubheader>
            <ul style={{ padding: 0 }}>{params.children}</ul>
          </li>
        )}
        renderOption={(props, option, { selected }) => (
          <li {...props}>
            <Checkbox
              icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
              checkedIcon={<CheckBoxIcon fontSize="small" />}
              style={{ marginRight: 8 }}
              checked={selected}
            />
            <Typography
              onMouseEnter={() => setHoveredOption(option)}
              onMouseLeave={() => setHoveredOption(undefined)}
              sx={{ width: 1, height: 1, padding: "10px" }}
            >
              {option.knowledge_statement}
            </Typography>
          </li>
        )}
        PaperComponent={(props) => (
          <Paper
            {...props}
            onMouseDown={(event) => event.preventDefault()}
            sx={{
              display: "flex",
              height: "19.5rem",
            }}
          >
            <Box
              flex={1}
              display="flex"
              flexDirection="column"
              justifyContent="space-between"
            >
              {props.children}
              <Box>
                <Divider />
                <Box display="flex" justifyContent="center" alignItems="center">
                  {selectedOptions.length === options.length ? (
                    <Button
                      startIcon={<PlaylistRemoveOutlinedIcon />}
                      variant="text"
                      sx={{
                        color: "#676C74",
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        lineHeight: "1.25rem",
                        zIndex: 200000,
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedOptions([]);
                      }}
                    >
                      Deselect all
                    </Button>
                  ) : (
                    <Button
                      startIcon={<PlaylistAddCheckOutlinedIcon />}
                      variant="text"
                      sx={{
                        color: "#676C74",
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        lineHeight: "1.25rem",
                        zIndex: 200000,
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedOptions(options);
                      }}
                    >
                      select all
                    </Button>
                  )}
                </Box>
              </Box>
            </Box>
            <Box flex={1}>
              {hoveredOption?.statement_preview ? (
                <Box
                  width={1}
                  height={1}
                  display="flex"
                  padding={"1rem"}
                  overflow={"auto"}
                >
                  <Stack spacing={2}>
                    <Stack spacing={1}>
                      <Typography
                        sx={{
                          color: "#A9ACB2",
                          fontSize: "0.75rem",
                          fontWeight: 500,
                          lineHeight: "1.125rem",
                        }}
                      >
                        Knowledge Statement ID
                      </Typography>
                      <Typography>{hoveredOption.id}</Typography>
                    </Stack>
                    <Stack spacing={0.5}>
                      <Typography
                        sx={{
                          color: "#A9ACB2",
                          fontSize: "0.75rem",
                          fontWeight: 500,
                          lineHeight: "1.125rem",
                        }}
                      >
                        Title
                      </Typography>
                      <Typography>
                        {hoveredOption.knowledge_statement}
                      </Typography>
                    </Stack>
                    <Stack spacing={0.5}>
                      <Typography
                        sx={{
                          color: "#A9ACB2",
                          fontSize: "0.75rem",
                          fontWeight: 500,
                          lineHeight: "1.125rem",
                        }}
                      >
                        Statement
                      </Typography>
                      <Typography>{hoveredOption.statement_preview}</Typography>
                    </Stack>
                  </Stack>
                </Box>
              ) : (
                <Box
                  width={1}
                  height={1}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Typography
                    sx={{
                      color: "#A9ACB2",
                      fontSize: "0.75rem",
                      fontWeight: 500,
                      lineHeight: "1.125rem",
                    }}
                  >
                    Hover over each nerve to its details
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
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
