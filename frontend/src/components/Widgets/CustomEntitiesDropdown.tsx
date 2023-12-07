import React, { useCallback, useEffect, useRef, useState } from "react";
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
import { CheckedItemIcon, UncheckedItemIcon } from "../icons";
import HoveredOptionContent from "./HoveredOptionContent";
import ClearOutlinedIcon from "@mui/icons-material/ClearOutlined";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import theme from "../../theme/Theme";
import PlaylistRemoveOutlinedIcon from "@mui/icons-material/PlaylistRemoveOutlined";
import PlaylistAddCheckOutlinedIcon from "@mui/icons-material/PlaylistAddCheckOutlined";
import NoResultField from "./NoResultField";
import { vars } from "../../theme/variables";
import { Option } from "../../types";
import Stack from "@mui/material/Stack";
import { processFromEntitiesData } from "../../helpers/dropdownMappers";

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
      background:
        "linear-gradient(270deg, #FFF 67.69%, rgba(255, 255, 255, 0.00) 116.94%)",
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
    maxWidth: "8rem",
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
      // zIndex: 10000
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
  options: {
    isFormDisabled = () => false,
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
    refreshStatement,
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

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setIsDropdownOpened(true);
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  const handleSelectedOptionsChange = async (newSelectedOptions: Option[]) => {
    setSelectedOptions(newSelectedOptions);
    onUpdate(newSelectedOptions, id);
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

  const handleSelectAll = (group: string) => {
    const newSelectedOptions = [...selectedOptions];
    autocompleteOptions
      .filter((option: Option) => option.group === group)
      .forEach((item) => {
        if (
          !newSelectedOptions.some(
            (selectedItem) => selectedItem.id === item.id,
          )
        ) {
          newSelectedOptions.push(item);
        }
      });
    handleSelectedOptionsChange(newSelectedOptions);
  };

  const handleDeselectAll = (group: string) => {
    const newSelectedOptions = selectedOptions.filter(
      (item) =>
        !autocompleteOptions
          .filter((option: Option) => option.group === group)
          .some((selectedItem) => selectedItem.id === item.id),
    );
    handleSelectedOptionsChange(newSelectedOptions);
  };

  const getGroupButton = (group: string) => {
    const allObjectsExist = selectedOptions.length === allOptions.length;
    return (
      <Button
        variant="text"
        sx={{
          color: darkBlue,
          fontSize: "0.75rem",
          fontWeight: 600,
          lineHeight: "1.125rem",
        }}
        onClick={() =>
          allObjectsExist ? handleDeselectAll(group) : handleSelectAll(group)
        }
      >
        {allObjectsExist ? `Deselect` : `Select`} All
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
    handleSelectedOptionsChange(updatedChips).then(() => refreshStatement());
  };

  const handleInputChange = (event: any) => {
    setInputValue(event.target.value);
  };

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
  }, [inputValue, id, onSearch, postProcessOptions]);

  useEffect(() => {
    if (!isDropdownOpened) return;
    setIsLoading(true);
    fetchData().then(() => setIsLoading(false));
  }, [isDropdownOpened, id, onSearch]);

  useEffect(() => {
    if (inputValue !== undefined) {
      setIsLoading(true);
      fetchData().then(() => setIsLoading(false));
    }
  }, [inputValue, id]);

  useEffect(() => {
    const closePopperOnClickOutside = (event: MouseEvent) => {
      if (
        popperRef.current &&
        !popperRef.current.contains(event.target as Node)
      ) {
        setAnchorEl(null);
        setInputValue("");
        refreshStatement && refreshStatement();
        setAllOptions([]);
      }
    };

    document.addEventListener("mousedown", closePopperOnClickOutside);
    return () => {
      document.removeEventListener("mousedown", closePopperOnClickOutside);
    };
  }, []);

  return isFormDisabled() ? (
    <Box
      sx={{ background: theme.palette.grey[100], borderRadius: 1 }}
      p={2}
      display="flex"
      justifyContent="center"
    >
      <Typography>{disabledReason}</Typography>
    </Box>
  ) : (
    <>
      <Stack direction="row" spacing={1} alignItems="center" width={1}>
        <Typography>{label}</Typography>

        <Badge
          sx={{ ...styles.badge, flex: 1 }}
          badgeContent={selectedOptions?.length}
        >
          <Box
            aria-describedby={aria}
            sx={
              open
                ? { ...styles.root, ...styles.rootOpen }
                : selectedOptions.length === 0
                ? styles.root
                : { ...styles.root, ...styles.rootHover }
            }
            onClick={handleClick}
          >
            {selectedOptions.length === 0 ? (
              <Typography sx={styles.placeholder}>{placeholder}</Typography>
            ) : (
              <Box gap={1} display="flex" flexWrap="wrap" alignItems="center">
                {selectedOptions?.length
                  ? selectedOptions
                      ?.slice(0, chipsNumber)
                      .map((item: Option, index) => {
                        return (
                          <Tooltip
                            title={item?.label}
                            placement="top"
                            arrow
                            key={item.id}
                          >
                            {CustomInputChip ? (
                              <CustomInputChip sx={styles.chip} entity={item} />
                            ) : (
                              <Chip
                                sx={{ ...styles.chip }}
                                variant={"outlined"}
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                                deleteIcon={<ClearOutlinedIcon />}
                                onDelete={(e) => {
                                  e.stopPropagation();
                                  handleChipRemove(item);
                                }}
                                label={item?.label}
                              />
                            )}
                          </Tooltip>
                        );
                      })
                  : null}
                {selectedOptions.length > chipsNumber &&
                  `+${selectedOptions.length - chipsNumber}`}
              </Box>
            )}
            {open ? (
              <ArrowDropUpIcon sx={styles.toggleIcon} />
            ) : (
              <ArrowDropDownIcon sx={styles.toggleIcon} />
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
                height: autocompleteOptions.length > 0 ? "2.75rem" : "auto",
                padding:
                  autocompleteOptions.length > 0 ? "0 0.875rem" : "0.875rem",
              }}
            >
              <Typography variant="body2">{header?.label}</Typography>
              {header?.values?.map((item: any, index: number) => (
                <Tooltip title={item} placement="top" arrow>
                  <Chip
                    key={item?.id}
                    sx={{
                      ...styles.chip,
                      display: "flex",
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
                  value={inputValue}
                  onChange={handleInputChange}
                  placeholder={searchPlaceholder}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon
                          sx={{ fontSize: "1rem", color: captionColor }}
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
                  sx={{ height: "100%" }}
                >
                  <CircularProgress />
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
                          {groupedOptions[group]
                            .filter((option: Option) =>
                              option.label
                                .toLowerCase()
                                .includes(
                                  inputValue !== undefined
                                    ? inputValue.toLowerCase()
                                    : "",
                                ),
                            )
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
                                  icon={<UncheckedItemIcon fontSize="small" />}
                                  checkedIcon={
                                    <CheckedItemIcon fontSize="small" />
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
                                    : option?.label}
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
                        startIcon={<PlaylistRemoveOutlinedIcon />}
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
                        startIcon={<PlaylistAddCheckOutlinedIcon />}
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
                <NoResultField noResultReason={noResultReason} />
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
                        Hover over each nerve to its details
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
