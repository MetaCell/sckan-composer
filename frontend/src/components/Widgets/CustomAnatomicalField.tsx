import React, { useEffect, useState } from "react";
import { TextField } from "@mui/material";
import FormControl from "@mui/material/FormControl";
import { Autocomplete, Box, InputAdornment } from "@mui/material";
import Paper from "@mui/material/Paper";
import { vars } from "../../theme/variables";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import Checkbox from "@mui/material/Checkbox";
import ListSubheader from "@mui/material/ListSubheader";
import Button from "@mui/material/Button";
import PlaylistRemoveOutlinedIcon from "@mui/icons-material/PlaylistRemoveOutlined";
import PlaylistAddCheckOutlinedIcon from "@mui/icons-material/PlaylistAddCheckOutlined";
import Chip from "@mui/material/Chip";
import ClearOutlinedIcon from "@mui/icons-material/ClearOutlined";
import theme from "../../theme/Theme";
import SearchIcon from '@mui/icons-material/Search';
import { CheckedItemIcon, UncheckedItemIcon } from "../icons";
import HoveredOptionContent from "./HoveredOptionContent";
const { titleFontColor } = vars;

type OptionDetail = {
  title: string; // What to display as the title/label for the property.
  value: string; // The actual value/content for the property.
};


type Option = {
  id: string;
  label: string;
  group: string;
  content: OptionDetail[];
}

export const CustomAnatomicalField = ({
  placeholder,
  options: { removeChip, label, statement, service, setter, errors, searchPlaceholder, noResultReason, disabledReason, onSearch, value, CustomHeader = null, CustomBody = null, CustomFooter = null },
}: any) => {
  const [autocompleteOptions, setAutocompleteOptions] = useState<Option[]>([]);

  const [isInputFocused, setInputFocus] = useState(false);

  const [hoveredOption, setHoveredOption] = useState<Option | null>(null);

  const [selectedOptions, setSelectedOptions] = useState<any[]>(
    [value] || []
  );
  const [searchValue, setSearchValue] = useState("");

  const formIsDisabled = !statement.destination;

  const onChange = (e: any, value: any) => {
    setSelectedOptions(value);
  };

  const handleSelectAll = (group: string) => {
    const newSelectedOptions = [...selectedOptions];
      autocompleteOptions.filter((option: Option) => option.group === group).forEach((item) => {
        if (
          !newSelectedOptions.some(
            (selectedItem) => selectedItem.id === item.id,
          )
        ) {
          newSelectedOptions.push(item);
        }
      });
      setSelectedOptions(newSelectedOptions);
  };

  const handleDeselectAll = (group: string) => {
    const newSelectedOptions = selectedOptions.filter(
      (item) =>
        !autocompleteOptions.filter((option: Option) => option.group === group).some((selectedItem) => selectedItem.id === item.id),
    );
    setSelectedOptions(newSelectedOptions);
  };

  const getGroupButton = (group: string) => {
    const allObjectsExist = autocompleteOptions.filter((option: Option) => option.group === group).every((obj1) =>
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
  };

  const handleInputChange = (value: string) => {
    if (value !== "" && value !== undefined) {
      setSearchValue(value);
      setAutocompleteOptions(onSearch(value))
    }
  };

  useEffect(() => {
    searchValue !== undefined &&
    setAutocompleteOptions(onSearch(searchValue));
  }, [searchValue, onSearch, autocompleteOptions]);

  const filterOptions = (options: Option[], { inputValue }: any) => {
    return options.filter((option: Option) =>
      option.label.toLowerCase().includes(inputValue.toLowerCase())
    );
  };

  return formIsDisabled ? (
    <Box
      sx={{ background: theme.palette.grey[100], borderRadius: 1 }}
      p={3}
      display="flex"
      justifyContent="center"
    >
      <Typography>
        {disabledReason}
      </Typography>
    </Box>
  ) : (
    <FormControl variant="standard">
      {label && (
        <Typography
          variant="h6"
          fontWeight={500}
          marginBottom={2}
          color={titleFontColor}
        >
          {label}
        </Typography>
      )}

      <Autocomplete
        sx={{
          "& .MuiFormControl-root": {
            "& .MuiInputBase-root": {
              borderColor:
                errors?.length !== 0 ? theme.palette.error.main : "#EAECF0",
            },
          },
        }}
        disableCloseOnSelect
        multiple
        disableClearable
        options={autocompleteOptions}
        filterOptions={filterOptions}
        onChange={(e, value) => onChange(e, value)}
        groupBy={(option) => option.group}
        value={selectedOptions}
        getOptionLabel={(option: any) => option?.label }
        isOptionEqualToValue={(option: any, value: any) =>
          option.id === value.id
        }
        renderTags={(value, getTagProps) =>
          value.map((option, index) => {
            const name = option?.label
            return (<Chip
              {...getTagProps({ index })}
              deleteIcon={<ClearOutlinedIcon />}
              variant="outlined"
              label={(name !== undefined && name?.length > 15) ? name.slice(0, 15) + "..." : name}
              key={option.id}
              sx={{
                borderRadius: "0.375rem",
                margin: "0.25rem",

                "& .MuiChip-label": {
                  fontSize: "0.875rem",
                },
                "& .MuiChip-deleteIcon": {
                  fontSize: "0.875rem",
                },
              }}
            />
            )
          })
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
              disableRipple
              icon={<UncheckedItemIcon fontSize="small" />}
              checkedIcon={<CheckedItemIcon fontSize="small" />}
              checked={selected}
            />
            <Typography
              onMouseEnter={() => setHoveredOption(option)}
              sx={{ width: 1, height: 1, padding: "0.625rem" }}
            >
              {option?.label}
            </Typography>
            <Typography variant="body2">{option?.id}</Typography>
          </li>
        )}
        PaperComponent={(props) => (
          <Paper
            {...props}
            onMouseDown={(event) => event.preventDefault()}
            sx={{
              display: "flex",
              height: "19.5rem",
              minWidth: autocompleteOptions.length > 0 ? '55.5rem' : '100%'
            }}
          >
            {autocompleteOptions.length > 0 ? (
              <>
                <Box
                  display="flex"
                  flexDirection="column"
                  flex={1} height={1}>
                  <TextField
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        border: 'none',
                        borderBottom: '0.0625rem solid #EAECF0',
                        boxShadow: '0rem 0.0625rem 0.125rem 0rem rgba(16, 24, 40, 0.05)',
                        borderRadius: 0
                      },
                      '& .MuiOutlinedInput-input': {
                        height: '3.125rem',
                        paddingTop: 0,
                        paddingBottom: 0
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        display: 'none'
                      }
                    }}
                    placeholder={searchPlaceholder}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: '1rem', color: '#667085' }} /></InputAdornment>
                    }}
                  />
                  <Box
                    height='calc(100% - 3.25rem)'
                    flex={1}
                    display="flex"
                    flexDirection="column"
                    justifyContent="space-between"
                    sx={{
                      '& .MuiAutocomplete-listbox': {
                        padding: '0 0.375rem',
                        '& .MuiAutocomplete-option': {
                          padding: '0.5625rem 0.625rem',
                          borderRadius: '0.375rem',
                          gap: '0.5rem',
                          alignItems: 'center',

                          '&[aria-selected="true"].Mui-focused': {
                            background: '#F2F4F7'
                          },

                          '&.Mui-focused': {
                            background: '#F2F4F7'
                          },

                          '& .MuiTypography-body1': {
                            color: '#344054',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            lineHeight: '142.857%',
                            padding: 0
                          },

                          '& .MuiTypography-body2': {
                            color: '#667085',
                            fontSize: '0.75rem',
                            fontWeight: 400,
                            lineHeight: '150%',
                            padding: 0,
                            whiteSpace: 'nowrap'
                          }
                        },
                      },
                      '& .MuiListSubheader-root': {
                        padding: '0 0.625rem',
                        height: '1.875rem',
                        margin: '0.375rem 0 0.125rem'
                      },
                      '& .MuiCheckbox-root': {
                        padding: 0
                      },
                      '& .MuiButton-root': {
                        padding: 0,
                        height: '1.625rem',
                        width: '5.0625rem',
                        fontSize: '0.75rem',
                        lineHeight: '1.125rem',
                        fontWeight: 600,
                        color: '#184EA2'
                      },
                      '& .MuiTypography-root': {
                        fontSize: '0.75rem',
                        lineHeight: '1.125rem',
                        fontWeight: 600,
                        color: '#344054'
                      }
                    }}
                  >
                    {props.children}
                    <Box
                      display="flex"
                      justifyContent="center"
                      alignItems="center"
                      sx={{
                        borderTop: '0.0625rem solid #ECEDEE',
                        height: '2.75rem',
                        flexShrink: 0,
                        boxShadow: '0 0.0625rem 0.125rem 0rem rgba(7, 8, 8, 0.05)',

                        '& .MuiButton-root': {
                          color: "#676C74",
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          lineHeight: "1.25rem",
                          zIndex: 200000,
                          width: 'auto',
                          px: '1rem'
                        }
                      }}
                    >
                      {selectedOptions.length === autocompleteOptions.length ? (
                        <Button
                          startIcon={<PlaylistRemoveOutlinedIcon />}
                          variant="text"
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
                          onClick={(e) => {
                            e.preventDefault();
                            setSelectedOptions(autocompleteOptions);
                          }}
                        >
                          Select all
                        </Button>
                      )}
                    </Box>
                  </Box>
                </Box>
                <Box overflow='auto' sx={{ background: '#FCFCFD' }} flex={1}>
                  {hoveredOption ? (
                    <HoveredOptionContent
                      entity={hoveredOption}
                      HeaderComponent={CustomHeader ?? CustomHeader}
                      BodyComponent={CustomBody ?? CustomBody}
                      FooterComponent={CustomFooter ?? CustomFooter}
                    />
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
              </>
            ) : (
              <Box
                width={1}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                }}
              >
                <Typography
                  variant="h6"
                  fontWeight={500}
                  marginBottom={2}
                  color={titleFontColor}
                >
                  No result found
                </Typography>

                <Typography variant="body1" marginBottom={2}>
                  { noResultReason }
                </Typography>
                <Button variant="outlined">Clear search</Button>
              </Box>
            )}
          </Paper>
        )}
        renderInput={(params) => (
          <TextField
            sx={{
              "label + &": {
                marginTop: theme.spacing(4),
              },
              "& .MuiOutlinedInput-notchedOutline": {
                border: 0,
              },
            }}
            {...params}
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
        onInputChange={(event, value) => {
          handleInputChange(value);
        }}
      />
      {errors && (
        <Typography color={theme.palette.error.main} mt={1}>
          {errors}
        </Typography>
      )}
    </FormControl>
  );
};