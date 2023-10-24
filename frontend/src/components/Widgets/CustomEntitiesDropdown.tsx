import React, { useState } from 'react';
// import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import { InputAdornment, List, ListItem, ListItemButton, ListItemText, styled } from "@mui/material";
// import Typography from "@mui/material/Typography";
import { vars } from "../../theme/variables";
import { CustomAnatomicalField } from "./CustomAnatomicalField";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from '@mui/icons-material/Search';
import { TextField, Autocomplete, Popover, Paper, Box, Typography, Button, Checkbox, ListSubheader, Chip } from '@mui/material';
import { CheckedItemIcon, UncheckedItemIcon } from "../icons";
import HoveredOptionContent from "./HoveredOptionContent";
import ClearOutlinedIcon from "@mui/icons-material/ClearOutlined";
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import theme from "../../theme/Theme";
import PlaylistRemoveOutlinedIcon from "@mui/icons-material/PlaylistRemoveOutlined";
import PlaylistAddCheckOutlinedIcon from "@mui/icons-material/PlaylistAddCheckOutlined";
import zIndex from '@mui/material/styles/zIndex';
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

const transition = {
  transition: 'all ease-in-out .3s'
}

const styles = {
  root: {
    gap: '0.5rem',
    minHeight: '2.5rem',
    borderRadius: '0.5rem',
    border: '0.0625rem solid #D0D5DD',
    cursor: 'pointer',
    background: '#FFF',
    display: 'flex',
    alignItems: 'center',
    padding: '0 0.75rem',
    boxShadow: '0 0.0625rem 0.125rem 0 rgba(16, 24, 40, 0.05)',
    ...transition,
    '&:after': {
      content: '""',
      width: '4.125rem',
      height: 'calc(100% - 0.125rem)',
      position: 'absolute',
      right: '0.0625rem',
      top: '0.0625rem',
      pointerEvents: 'none',
      background: 'linear-gradient(270deg, #FFF 67.69%, rgba(255, 255, 255, 0.00) 116.94%)',
      borderRadius: '0 0.5rem 0.5rem 0'
    }
  },

  rootHover: {
    '&:hover': {
      borderColor: '#8DB2EE',
      boxShadow: '0rem 0rem 0rem 0.25rem #CEDDED, 0rem 0.0625rem 0.125rem 0rem rgba(16, 24, 40, 0.05)'
    }
  },

  rootOpen: {
    borderColor: '#8DB2EE',
    boxShadow: '0rem 0rem 0rem 0.25rem #CEDDED, 0rem 0.0625rem 0.125rem 0rem rgba(16, 24, 40, 0.05)'
  },

  chip: {
    padding: '0.125rem 0.25rem 0.125rem 0.3125rem',
    gap: '0.1875rem',
    height: '1.5rem',
    borderRadius: '0.375rem',
    border: '0.0625rem solid #D0D5DD',
    background: '#FFF',
    color: '#344054',
    fontSize: '0.875rem',
    fontWeight: 500,


    '& .MuiChip-label': {
      padding: 0
    },

    '& .MuiChip-deleteIcon': {
      margin: 0,
      color: '#98A2B3',
      fontSize: '0.75rem',
      zIndex: '9999'
    }
  },


  popover: {
    '& .MuiPopover-paper': {
      height: "19.5rem",
      display: 'flex',
      width: '55.5rem',
      borderRadius: '0.5rem',
      border: '0.0625rem solid #ECEDEE',
      background: '#FFF',
      boxShadow: '0 0.5rem 0.5rem -0.25rem rgba(7, 8, 8, 0.03), 0 1.25rem 1.5rem -0.25rem rgba(7, 8, 8, 0.08)',
      mt: '0.25rem'
    }
  },

  toggleIcon: {
    ml: 'auto',
    position: 'relative',
    zIndex: 9,
    fontSize: '1.25rem',
    color: '#667085'
  },

  placeholder: {
    color: '#667085',
    fontSize: '0.875rem',
    fontWeight: 400,
    userSelect: 'none'
  },

  list: {
    width: '50%',
    flexShrink: 0,
  },

  details: {
    background: '#FCFCFD',
    width: '50%',
    overflow: 'auto',
    flexShrink: 0,
    '& .MuiTypography-body2': {
      color: '#373A3E',
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: '142.857%',
      padding: 0
    },

    '& .MuiTypography-body1': {
      color: '#A9ACB2',
      fontSize: '0.75rem',
      fontWeight: 500,
      lineHeight: '150%',
      padding: 0,
    }
  }
}

export default function CustomEntitiesDropdown({
  placeholder,
  options: { entity, statement, errors, searchPlaceholder, noResultReason, disabledReason, onSearch, value, CustomHeader = null, CustomBody = null, CustomFooter = null, header = {} },
}: any) {
  const [searchValue, setSearchValue] = useState("");
  const [anchorEl, setAnchorEl] = React.useState<any>(null);
  const [hoveredOption, setHoveredOption] = useState<Option | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Option[]>(
    [value] || []
  );
  const [autocompleteOptions, setAutocompleteOptions] = useState<Option[]>([]);
  const [inputValue, setInputValue] = useState('');

  React.useEffect(() => {
    searchValue !== undefined &&
      setAutocompleteOptions(onSearch(searchValue));
  }, [searchValue, onSearch, autocompleteOptions]);

  const handleClick = (event: any) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const groupedOptions = autocompleteOptions.reduce((grouped: any, option: Option) => {
    const group = option.group;
    if (!grouped[group]) {
      grouped[group] = [];
    }
    grouped[group].push(option);
    return grouped;
  }, {});

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

  const handleOptionSelection = (option: Option) => {
    const isOptionAlreadySelected = selectedOptions.some((selected) => selected.id === option.id);
  
    if (isOptionAlreadySelected) {
      const updatedSelectedOptions = selectedOptions.filter((selected) => selected.id !== option.id);
      setSelectedOptions(updatedSelectedOptions);
    } else {
      setSelectedOptions([...selectedOptions, option]);
    }
  };

  const handleChipRemove = (chip: Option) => {
    const updatedChips = selectedOptions.filter((c: any) => c !== chip);
    setSelectedOptions(updatedChips);
  };

  const handleInputChange = (event: any) => {
    setInputValue(event.target.value);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'simple-popover' : undefined;

  const isOptionSelected = (option: Option) => {
    return selectedOptions.some((selected) => selected.id === option.id);
  };
  // show the disable message only in case of forward connections
  const formIsDisabled = !statement.destination && entity === 'Connections';
  
  return  formIsDisabled ? (
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
    <>
      <Box
        aria-describedby={id}
        sx={
          open ?
            { ...styles.root, ...styles.rootOpen } : selectedOptions.length === 0 ? styles.root : { ...styles.root, ...styles.rootHover }}
        onClick={handleClick}
      >
        {selectedOptions.length === 0 ? (
          <Typography sx={styles.placeholder}>{placeholder}</Typography>
        ) : (
          <Box gap={1} display='flex' flexWrap='wrap'>
            {selectedOptions?.map((item: any) => (
              <Chip
                key={item?.id}
                sx={styles.chip}
                variant='outlined'
                deleteIcon={<ClearOutlinedIcon />}
                onDelete={(e) => {
                  e.stopPropagation();
                  handleChipRemove(item);
                }}
                label={item?.label?.length > 15 ?  item?.label.slice(0, 15) + "..." : item?.label}
              />
            ))}
          </Box>
        )}

        {open ? <ArrowDropUpIcon sx={styles.toggleIcon} /> : <ArrowDropDownIcon sx={styles.toggleIcon} />}

      </Box>

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        sx={styles.popover}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <Box sx={styles.list}>
          { header?.values?.length > 0 && (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              sx={{
                borderTop: '0.0625rem solid #ECEDEE',
                height: '2.75rem',
              }}
            >
              <Typography variant="body2" marginBottom={2}>
                { header?.label }
              </Typography>
              {header?.values?.map((item: any) => (
                <Chip
                  key={item?.id}
                  sx={styles.chip}
                  variant='outlined'
                  label={item}
                />
              ))}
            )
            </Box>
          )}
            <Box sx={{
            borderBottom: '0.0625rem solid #ECEDEE',
            height: '3.125rem',
            padding: '0 0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            flexWrap: 'wrap',
            overflowY: 'auto',

            '& .MuiOutlinedInput-input': {
              padding: 0,
              fontSize: '0.75rem',
              color: '#676C74',
              fontWeight: '400',
              height: '3.125rem',

              '&::placeholder': {
                fontSize: '0.75rem',
                color: '#676C74',
                fontWeight: '400',
              }
            },

            '& .MuiOutlinedInput-notchedOutline': {
              display: 'none'
            },

            '& .MuiOutlinedInput-root': {
              border: 'none',
              boxShadow: 'none',
              padding: '0'
            }
          }}>
            <TextField
              fullWidth={selectedOptions.length === 0}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              placeholder={searchPlaceholder}
              InputProps={{
                startAdornment: <InputAdornment position='start'><SearchIcon sx={{fontSize: '1rem', color: '#667085'}} /></InputAdornment>
              }}
            />
            </Box>
            {autocompleteOptions.length > 0 ? (
              <>
              <Box overflow='auto' height='calc(100% - (2.75rem + 3.125rem))'>
                {Object.keys(groupedOptions).map((group) => (
                  <Box sx={{
                    padding: '0 0.375rem',
                    '& .MuiListSubheader-root': {
                      padding: '0 0 0 0.625rem',
                      height: '1.875rem',
                      margin: '0.375rem 0 0.125rem',

                      '& .MuiTypography-root': {
                        fontSize: '0.75rem',
                        lineHeight: '1.125rem',
                        fontWeight: 600,
                        color: '#344054'
                      },
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

                    '& ul': {
                      margin: 0,
                      listStyle: 'none',
                      padding: '0',

                      '& li': {
                        padding: '0.6875rem 0.625rem',
                        display: 'flex',
                        gap: '0.5rem',
                        cursor: 'pointer',

                        '&:hover': {
                          borderRadius: '0.375rem',
                          background: '#F2F4F7'
                        },

                        '&.selected': {
                          borderRadius: '0.375rem',
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
                      }
                    }
                  }} key={group}>
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
                        {group}
                      </Typography>
                      {getGroupButton(group)}
                    </ListSubheader>
                    <ul>
                      {groupedOptions[group]
                        .filter((suggestion: any) =>
                          suggestion.label.toLowerCase().includes(inputValue.toLowerCase())
                        )
                        .map((suggestion: any) => (
                          <li
                            key={suggestion.id}
                            onMouseEnter={() => setHoveredOption(suggestion)}
                            onClick={() => handleOptionSelection(suggestion)}
                            className={isOptionSelected(suggestion) ? 'selected' : ''}
                          >
                            <Checkbox
                              disableRipple
                              icon={<UncheckedItemIcon fontSize="small" />}
                              checkedIcon={<CheckedItemIcon fontSize="small" />}
                              checked={isOptionSelected(suggestion)}
                            />
                            <Typography
                              sx={{ width: 1, height: 1, padding: "0.625rem" }}
                            >
                              {suggestion?.label}
                            </Typography>
                            <Typography whiteSpace='nowrap' variant="body2">{suggestion?.id}</Typography>
                          </li>
                        ))}
                    </ul>
                  </Box>
                ))}
              </Box>
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                sx={{
                  borderTop: '0.0625rem solid #ECEDEE',
                  height: '2.75rem',

                  '& .MuiButton-root': {
                    color: "#676C74",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    height: '100%',
                    lineHeight: "1.25rem",
                    zIndex: 200000,
                    width: '100%',
                    borderRadius: 0,
                    p: 0,
                    '&:hover': {
                      background: '#F2F4F7'
                    }
                  }
                }}
              >
                {selectedOptions.length === autocompleteOptions.length ? (
                  <Button
                    disableRipple
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
                    disableRipple
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
        </Box>
        <Box sx={styles.details}>
          { autocompleteOptions.length > 0 && (hoveredOption ? (
            <HoveredOptionContent
              entity={hoveredOption}
              HeaderComponent={CustomHeader ?? CustomHeader}
              BodyComponent={CustomBody ?? CustomBody}
              FooterComponent={CustomFooter ?? CustomFooter}
            />
          ) : (
            <Box height={1} display='flex' alignItems='center' justifyContent='center'>
              <Typography variant='body2'>
                Hover over each nerve to its details
              </Typography>
            </Box>
          ))}

        </Box>
      </Popover>
      {errors && (
        <Typography color={theme.palette.error.main} mt={1}>
          {errors}
        </Typography>
      )}
    </>
  )
}
