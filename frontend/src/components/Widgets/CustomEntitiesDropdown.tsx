import React, {useCallback, useEffect, useRef, useState, useMemo} from "react";
import {
  Badge,
  CircularProgress,
  InputAdornment,
  Popper,
  Tooltip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import {
  TextField,
  Box,
  Typography,
  Button,
  Checkbox,
  ListSubheader,
  Chip,
} from "@mui/material";
import {CheckedItemIcon, CheckedItemIconBG, UncheckedItemIcon} from "../icons";
import HoveredOptionContent from "./HoveredOptionContent";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import theme from "../../theme/Theme";
import PlaylistRemoveOutlinedIcon from "@mui/icons-material/PlaylistRemoveOutlined";
import PlaylistAddCheckOutlinedIcon from "@mui/icons-material/PlaylistAddCheckOutlined";
import NoResultField from "./NoResultField";
import {vars} from "../../theme/variables";
import {Option} from "../../types";
import Stack from "@mui/material/Stack";
import {processFromEntitiesData} from "../../helpers/dropdownMappers";
import CustomChipBoxComponent from "./CustomChipBoxComponent";
import { debounce } from "@mui/material";
import { SEARCH_DEBOUNCE } from "../../settings";
import {ChangeRequestStatus} from "../../helpers/settings";

const {
  buttonOutlinedBorderColor,
  darkBlue,
  whiteColor,
  dropdownBorderColor,
  buttonOutlinedColor,
  lightBlue,
  inputTextColor,
  dropdownChipColor,
  captionColor,
  bodyBgColor,
  badgeBg,
  drodownDetailBg,
  dropdownHeadingColor,
  dropdownTextColor,
  grey400,
  popperBorderColor,
} = vars;

const transition = {
  transition: "all ease-in-out .3s",
};

const styles = {
  root: {
    gap: "0.5rem",
    minHeight: "2.5rem",
    borderRadius: "0.5rem",
    border: `0.0625rem solid ${buttonOutlinedBorderColor}`,
    cursor: "pointer",
    background: whiteColor,
    display: "flex",
    alignItems: "center",
    padding: "0.5rem 0.75rem",
    boxShadow: "0 0.0625rem 0.125rem 0 rgba(16, 24, 40, 0.05)",
    ...transition,
    "&:after": {
      content: '""',
      width: "4.125rem",
      height: "calc(100% - 0.125rem)",
      position: "absolute",
      right: "0.0625rem",
      top: "0.0625rem",
      pointerEvents: "none",
      borderRadius: "0 0.5rem 0.5rem 0",
    },
  },
  
  rootHover: {
    "&:hover": {
      borderColor: dropdownBorderColor,
      boxShadow:
        "0rem 0rem 0rem 0.25rem #CEDDED, 0rem 0.0625rem 0.125rem 0rem rgba(16, 24, 40, 0.05)",
    },
  },
  
  rootOpen: {
    borderColor: dropdownBorderColor,
    boxShadow:
      "0rem 0rem 0rem 0.25rem #CEDDED, 0rem 0.0625rem 0.125rem 0rem rgba(16, 24, 40, 0.05)",
  },
  
  chip: {
    padding: "0.125rem 0.25rem 0.125rem 0.3125rem",
    gap: "0.1875rem",
    height: "1.5rem",
    borderRadius: "0.375rem",
    fontSize: "0.875rem",
    fontWeight: 500,
    
    "&.MuiChip-filled": {
      borderRadius: "1rem",
      background: lightBlue,
      color: darkBlue,
      mixBlendMode: "multiply",
    },
    
    "&.MuiChip-outlined": {
      color: buttonOutlinedColor,
      background: whiteColor,
      border: `0.0625rem solid ${buttonOutlinedBorderColor}`,
    },
    
    "& .MuiChip-label": {
      padding: 0,
    },
    
    "& .MuiChip-deleteIcon": {
      margin: 0,
      color: grey400,
      fontSize: "0.75rem",
    },
  },
  
  toggleIcon: {
    ml: "auto",
    position: "relative",
    zIndex: 9,
    fontSize: "1.25rem",
    color: captionColor,
  },
  
  placeholder: {
    color: captionColor,
    fontSize: "0.875rem",
    fontWeight: 400,
    userSelect: "none",
  },
  
  list: {
    width: "50%",
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
  },
  
  badge: {
    display: "block",
    "& .MuiBadge-badge": {
      position: "absolute",
      width: "1.375rem",
      height: "1.375rem",
      color: darkBlue,
      background: badgeBg,
      textAlign: "center",
      fontSize: "0.75rem",
      borderRadius: "3.125rem",
      fontWeight: 500,
      lineHeight: "150%",
    },
  },
  
  details: {
    background: drodownDetailBg,
    width: "50%",
    overflow: "auto",
    flexShrink: 0,
    "& .MuiTypography-body2": {
      color: dropdownHeadingColor,
      fontSize: "0.875rem",
      fontWeight: 400,
      lineHeight: "142.857%",
      padding: 0,
    },
    
    "& .MuiTypography-body1": {
      color: dropdownTextColor,
      fontSize: "0.75rem",
      fontWeight: 500,
      lineHeight: "150%",
      padding: 0,
    },
  },
};

export default function CustomEntitiesDropdown({
     value,
     id,
     placeholder: plcholder,
     options: {
       errors,
       searchPlaceholder,
       noResultReason,
       disabledReason,
       onSearch,
       onUpdate,
       mapValueToOption,
       CustomHeader = null,
       CustomBody = null,
       CustomFooter = null,
       header = {},
       CustomInputChip = null,
       placeholder,
       label,
       chipsNumber = 2,
       postProcessOptions = false,
       getPreLevelSelectedValues,
       areConnectionsExplicit,
       minWidth = '',
       isDisabled
     },
   }: any) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const aria = open ? "simple-popper" : undefined;
  
  const [hoveredOption, setHoveredOption] = useState<Option | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Option[]>(
    mapValueToOption(value, id) || [],
  );
  
  const [autocompleteOptions, setAutocompleteOptions] = useState<Option[]>([]);
  const [inputValue, setInputValue] = useState<string | undefined>(undefined);
  const popperRef = useRef<HTMLDivElement | null>(null);
  
  const [isDropdownOpened, setIsDropdownOpened] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [allOptions, setAllOptions] = useState<Option[]>([]);
  
  const [hasValueChanged, setHasValueChanged] = useState(false);
  const areAllSelectedValuesFromTheAboveLayer = postProcessOptions && areConnectionsExplicit ? areConnectionsExplicit(id) : true
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (!isDisabled) {
      setIsDropdownOpened(true);
      setAnchorEl(anchorEl ? null : event.currentTarget);
    }
  };
  const handleSelectedOptionsChange = async (newSelectedOptions: Option[]) => {
    const result = await onUpdate(newSelectedOptions, id);
    if (result !== ChangeRequestStatus.CANCELLED) {
      setSelectedOptions(newSelectedOptions);
      setHasValueChanged(true);
    }
  };
  
  const groupedOptions = autocompleteOptions.reduce(
    (grouped: any, option: Option) => {
      const group = option.group;
      if (!grouped[group]) {
        grouped[group] = [];
      }
      grouped[group].push(option);
      return grouped;
    },
    {},
  );

  const isInOptions = (option: Option, inputValue: string) => {
    return option.content.map((content) => content.value.toLowerCase())
      .join(' ').includes(inputValue.toLowerCase());
  }

  const handleSelectDeselectGroup = (group: string) => {
    const newSelectedOptions = [...selectedOptions];
    const groupOptions = autocompleteOptions.filter((option: Option) => option.group === group);
    
    // Check if all options in this group are already selected
    const allSelectedInGroup = groupOptions.every(
      (groupOption) => newSelectedOptions.some((selectedOption) => selectedOption.id === groupOption.id)
    );
    
    if (allSelectedInGroup) {
      // Deselect all options in this group
      groupOptions.forEach((option) => {
        const index = newSelectedOptions.findIndex((selected) => selected.id === option.id);
        if (index !== -1) {
          newSelectedOptions.splice(index, 1);
        }
      });
    } else {
      // Select all options in this group
      groupOptions.forEach((option) => {
        if (!newSelectedOptions.some((selected) => selected.id === option.id)) {
          newSelectedOptions.push(option);
        }
      });
    }
    
    handleSelectedOptionsChange(newSelectedOptions);
  };
  
  const getGroupButton = (group: string) => {
    const groupOptions = autocompleteOptions.filter((option: Option) => option.group === group);
    const allSelectedInGroup = groupOptions.every(
      (groupOption) => selectedOptions.some((selectedOption) => selectedOption.id === groupOption.id)
    );
    
    return (
      <Button
        variant="text"
        sx={{
          color: darkBlue,
          fontSize: "0.75rem",
          fontWeight: 600,
          lineHeight: "1.125rem",
        }}
        onClick={() => handleSelectDeselectGroup(group)}
      >
        {allSelectedInGroup ? `Deselect all` : `Select all`}
      </Button>
    );
  };
  
  const handleOptionSelection = (option: Option) => {
    const isOptionAlreadySelected = selectedOptions?.some(
      (selected) => selected.id === option.id,
    );
    if (isOptionAlreadySelected) {
      const updatedSelectedOptions = selectedOptions.filter(
        (selected) => selected.id !== option.id,
      );
      handleSelectedOptionsChange(updatedSelectedOptions);
    } else {
      handleSelectedOptionsChange([...selectedOptions, option]);
    }
  };
  
  const handleChipRemove = (chip: Option) => {
    const updatedChips = selectedOptions.filter((c: Option) => c !== chip);
    handleSelectedOptionsChange(updatedChips);
  };
  
  const handleInputChange = (event: any) => {
    setHoveredOption(null);
    setInputValue(event.target.value);
  };

  const debouncedResults = useMemo(() => {
    return debounce(handleInputChange, SEARCH_DEBOUNCE);
  }, []);
  
  const isOptionSelected = (option: Option) => {
    return selectedOptions?.some((selected) => selected?.id === option?.id);
  };
  
  const fetchData = useCallback(async () => {
    try {
      const options = await onSearch(inputValue, id, selectedOptions);
      const allOptions = [...selectedOptions, ...options];
      const sortedOptions = postProcessOptions
        ? processFromEntitiesData(allOptions)
        : allOptions;
      setAllOptions(sortedOptions);
      setAutocompleteOptions(sortedOptions);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, [inputValue, id, onSearch, postProcessOptions, selectedOptions]);
  
  const getLabel = (option: Option) => {
    if (option?.content.length > 3) {
      const index = option?.label.lastIndexOf('(');
      return <> {option?.label.slice(0, index)} <b>{option.label.slice(index)}</b> </>;
    } else {
      return option?.label;
    }
  }
  
  useEffect(() => {
    if (!isDropdownOpened) return;
    setIsLoading(true);
    fetchData().then(() => setIsLoading(false));
  }, [inputValue, isDropdownOpened, fetchData]);
  
  useEffect(() => {
    const preLevelItems = postProcessOptions && getPreLevelSelectedValues ? getPreLevelSelectedValues(id) : [];
    
    const closePopperOnClickOutside = (event: MouseEvent) => {
      if (
        popperRef.current &&
        !popperRef.current.contains(event.target as Node)
      ) {
        setAnchorEl(null);
        setInputValue("");
        setAllOptions([]);
        if (hasValueChanged) {
          setHasValueChanged(false);
        }
        if (postProcessOptions && selectedOptions.length === 0) {
          setSelectedOptions(processFromEntitiesData(preLevelItems))
        }
      }
    };

    document.addEventListener("mousedown", closePopperOnClickOutside);
    return () => {
      document.removeEventListener("mousedown", closePopperOnClickOutside);
    };
  }, [hasValueChanged, postProcessOptions, getPreLevelSelectedValues, selectedOptions.length, id]);

  return isDisabled ? (
    disabledReason ? (
      <Box
        sx={{ background: theme.palette.grey[100], borderRadius: 1 }}
        p={2}
        display="flex"
        justifyContent="center"
      >
        <Typography>{disabledReason}</Typography>
      </Box>
    ) : (
      <Stack direction="row" spacing={1} alignItems="center" width={1}>
        <Typography>{label}</Typography>
        <CustomChipBoxComponent
          selectedOptions={selectedOptions}
          CustomInputChip={CustomInputChip}
          styles={styles}
          isDisabled={isDisabled}
          handleChipRemove={handleChipRemove}
          chipsNumber={chipsNumber}
        />
      </Stack>
    )
  ) : (
    <>
      <Stack direction="row" spacing={1} alignItems="center" width={1}>
        <Typography>{label}</Typography>
            <Badge
              sx={{...styles.badge, flex: 1}}
              badgeContent={
                !areAllSelectedValuesFromTheAboveLayer ? 0 : selectedOptions?.length
              }
            >
              <Box
                aria-describedby={aria}
                sx={{
                  minWidth: minWidth ? minWidth : "auto",
                  ...(open
                    ? {...styles.root, ...styles.rootOpen}
                    : selectedOptions.length === 0
                      ? styles.root
                      : {...styles.root, ...styles.rootHover}),
                }}
                onClick={handleClick}
              >
                {!areAllSelectedValuesFromTheAboveLayer ||
                selectedOptions.length === 0 ? (
                  <Typography sx={styles.placeholder}>{placeholder || plcholder}</Typography>
                ) : (
                  <CustomChipBoxComponent
                    selectedOptions={selectedOptions}
                    CustomInputChip={CustomInputChip}
                    styles={styles}
                    isDisabled={isDisabled}
                    handleChipRemove={handleChipRemove}
                    chipsNumber={chipsNumber}
                  />
                )}
                {open ? (
                  <ArrowDropUpIcon sx={styles.toggleIcon}/>
                ) : (
                  <ArrowDropDownIcon sx={styles.toggleIcon}/>
                )}
              </Box>
            </Badge>
            
            <Popper
              ref={popperRef}
              id={aria}
              open={open}
              placement="bottom-start"
              anchorEl={anchorEl}
              sx={{
                height: "28.125rem",
                borderRadius: "0.5rem",
                border: `0.0625rem solid ${popperBorderColor}`,
                background: whiteColor,
                boxShadow:
                  "0 0.5rem 0.5rem -0.25rem rgba(7, 8, 8, 0.03), 0 1.25rem 1.5rem -0.25rem rgba(7, 8, 8, 0.08)",
                m: "0.25rem 0  !important",
                width: autocompleteOptions.length > 0 ? "55.5rem" : "27.75rem",
                display: "flex",
                flexDirection: "column",
                zIndex: 9999,
              }}
            >
              {header?.values?.length > 0 && (
                <Box
                  display="flex"
                  alignItems="center"
                  flexWrap="wrap"
                  gap={1}
                  sx={{
                    borderBottom: `0.0625rem solid ${popperBorderColor}`,
                    padding:
                      autocompleteOptions.length > 0 ? "0 0.875rem" : "0.875rem",
                  }}
                >
                  <Typography variant="body2">{header?.label}</Typography>
                  {header?.values?.map((item: any, index: number) => (
                    <Tooltip key={`tooltip${index}`} title={item} placement="top" arrow>
                      <Chip
                        key={item?.id}
                        sx={{
                          ...styles.chip,
                          display: "flex",
                          textAlign: "left",
                        }}
                        variant="outlined"
                        label={
                          <>
                            <Typography
                              sx={{
                                verticalAlign: "text-bottom",
                                display: "inline-block",
                                mr: "0.25rem",
                                borderRadius: "0.1875rem",
                                background: dropdownChipColor,
                                px: "0.25rem",
                                fontSize: "0.75rem",
                                color: buttonOutlinedColor,
                                fontWeight: 600,
                                height: "1.125rem",
                              }}
                              component="span"
                            >
                              {index + 1}
                            </Typography>
                            {item}
                          </>
                        }
                      />
                    </Tooltip>
                  ))}
                </Box>
              )}
              <Box
                display="flex"
                flex={1}
                height={
                  autocompleteOptions.length > 0 ? "calc(100% - 2.75rem)" : "auto"
                }
              >
                <Box
                  sx={{
                    ...styles.list,
                    width: autocompleteOptions.length > 0 ? "50%" : "100%",
                  }}
                >
                  <Box
                    sx={{
                      borderBottom: `0.0625rem solid ${popperBorderColor}`,
                      height: "3.125rem",
                      padding: "0 0.875rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      flexWrap: "wrap",
                      
                      "& .MuiOutlinedInput-input": {
                        padding: 0,
                        fontSize: "0.75rem",
                        color: inputTextColor,
                        fontWeight: "400",
                        height: "3.125rem",
                        
                        "&::placeholder": {
                          fontSize: "0.75rem",
                          color: inputTextColor,
                          fontWeight: "400",
                        },
                      },
                      
                      "& .MuiOutlinedInput-notchedOutline": {
                        display: "none",
                      },
                      
                      "& .MuiOutlinedInput-root": {
                        border: "none",
                        boxShadow: "none",
                        padding: "0",
                      },
                    }}
                  >
                    <TextField
                      fullWidth
                      type="text"
                      autoFocus={true}
                      onChange={debouncedResults}
                      placeholder={searchPlaceholder}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon
                              sx={{fontSize: "1rem", color: captionColor}}
                            />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>
                  {isLoading ? (
                    <Box
                      display="flex"
                      justifyContent="center"
                      alignItems="center"
                      sx={{height: "100%"}}
                    >
                      <CircularProgress/>
                    </Box>
                  ) : autocompleteOptions.length > 0 ? (
                    <>
                      <Box
                        overflow="auto"
                        height="calc(100% - (2.75rem + 3.125rem))"
                      >
                        {Object.keys(groupedOptions).map((group) => (
                          <Box
                            sx={{
                              padding: "0 0.375rem",
                              "& .MuiListSubheader-root": {
                                padding: "0 0 0 0.625rem",
                                height: "1.875rem",
                                margin: "0.375rem 0 0.125rem",
                                
                                "& .MuiTypography-root": {
                                  fontSize: "0.75rem",
                                  lineHeight: "1.125rem",
                                  fontWeight: 600,
                                  color: buttonOutlinedColor,
                                },
                              },
                              "& .MuiCheckbox-root": {
                                padding: 0,
                              },
                              "& .MuiButton-root": {
                                padding: 0,
                                height: "1.625rem",
                                width: "5.0625rem",
                                fontSize: "0.75rem",
                                lineHeight: "1.125rem",
                                fontWeight: 600,
                                color: darkBlue,
                              },
                              
                              "& ul": {
                                margin: 0,
                                listStyle: "none",
                                padding: "0",
                                
                                "& li": {
                                  padding: "0.6875rem 0.625rem",
                                  display: "flex",
                                  gap: "0.5rem",
                                  cursor: "pointer",
                                  
                                  "&:hover": {
                                    borderRadius: "0.375rem",
                                    background: bodyBgColor,
                                  },
                                  
                                  "&.selected": {
                                    borderRadius: "0.375rem",
                                    background: bodyBgColor,
                                  },
                                  
                                  "&.selected-unchecked": {
                                    "& .MuiButtonBase-root": {
                                      "&.Mui-checked": {
                                        color: "red",
                                      },
                                    },
                                  },
                                  
                                  "& .MuiTypography-body1": {
                                    color: buttonOutlinedColor,
                                    fontSize: "0.875rem",
                                    fontWeight: 500,
                                    lineHeight: "142.857%",
                                    padding: 0,
                                  },
                                  
                                  "& .MuiTypography-body2": {
                                    color: captionColor,
                                    fontSize: "0.75rem",
                                    fontWeight: 400,
                                    lineHeight: "150%",
                                    padding: 0,
                                    whiteSpace: "nowrap",
                                  },
                                },
                              },
                            }}
                            key={group}
                          >
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
                                  color: buttonOutlinedColor,
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
                              {
                                groupedOptions[group]
                                  .filter((option: Option) => isInOptions(option, inputValue || ''))
                                .map((option: Option) => (
                                  <li
                                    key={option.id}
                                    onMouseEnter={() => setHoveredOption(option)}
                                    onClick={() => handleOptionSelection(option)}
                                    className={
                                      isOptionSelected(option) ? "selected" : ""
                                    }
                                  >
                                    <Checkbox
                                      disableRipple
                                      icon={<UncheckedItemIcon fontSize="small"/>}
                                      checkedIcon={
                                        !areAllSelectedValuesFromTheAboveLayer &&
                                        !hasValueChanged ? (
                                          <CheckedItemIconBG
                                            fontSize="small"
                                            style={{color: "#C6D9F6"}}
                                          />
                                        ) : (
                                          <CheckedItemIcon fontSize="small"/>
                                        )
                                      }
                                      checked={isOptionSelected(option)}
                                    />
                                    <Typography
                                      sx={{
                                        width: 1,
                                        height: 1,
                                        padding: "0.625rem",
                                      }}
                                    >
                                      {option?.label?.length > 100
                                        ? option?.label.slice(0, 100) + "..."
                                        : getLabel(option)}
                                    </Typography>
                                    <Typography whiteSpace="nowrap" variant="body2">
                                      {option?.id}
                                    </Typography>
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
                          borderTop: `0.0625rem solid ${popperBorderColor}`,
                          height: "2.75rem",
                          
                          "& .MuiButton-root": {
                            color: inputTextColor,
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            height: "100%",
                            lineHeight: "1.25rem",
                            zIndex: 200000,
                            width: "100%",
                            borderRadius: 0,
                            p: 0,
                            "&:hover": {
                              background: bodyBgColor,
                            },
                          },
                        }}
                      >
                        {allOptions.length === selectedOptions.length ? (
                          <Button
                            disableRipple
                            startIcon={<PlaylistRemoveOutlinedIcon/>}
                            variant="text"
                            onClick={(e) => {
                              e.preventDefault();
                              handleSelectedOptionsChange([]);
                            }}
                          >
                            Deselect all
                          </Button>
                        ) : (
                          <Button
                            disableRipple
                            startIcon={<PlaylistAddCheckOutlinedIcon/>}
                            variant="text"
                            onClick={(e) => {
                              e.preventDefault();
                              handleSelectedOptionsChange(autocompleteOptions);
                            }}
                          >
                            Select all
                          </Button>
                        )}
                      </Box>
                    </>
                  ) : (
                    <NoResultField noResultReason={noResultReason}/>
                  )}
                </Box>
                {autocompleteOptions.length > 0 && (
                  <Box sx={styles.details}>
                    {autocompleteOptions.length > 0 &&
                      (hoveredOption ? (
                        <HoveredOptionContent
                          entity={hoveredOption}
                          HeaderComponent={CustomHeader ?? CustomHeader}
                          BodyComponent={CustomBody ?? CustomBody}
                          FooterComponent={CustomFooter ?? CustomFooter}
                        />
                      ) : (
                        <Box
                          height={1}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Typography variant="body2">
                            Hover over each nerve to show its details
                          </Typography>
                        </Box>
                      ))}
                  </Box>
                )}
              </Box>
            </Popper>
      </Stack>
      {errors && (
        <Typography color={theme.palette.error.main} mt={1} ml={2}>
          {errors}
        </Typography>
      )}
    </>
  );
}
