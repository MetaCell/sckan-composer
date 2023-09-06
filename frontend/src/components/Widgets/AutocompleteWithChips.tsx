import React, {useState} from "react";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import { Autocomplete, styled } from "@mui/material";
import Chip from "@mui/material/Chip";
import ClearOutlinedIcon from "@mui/icons-material/ClearOutlined";
import { vars } from "../../theme/variables";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";

const { buttonOutlinedColor, grey400, buttonOutlinedBorderColor, titleFontColor } = vars;

const StyledInput = styled(TextField)(({ theme }) => ({
  "label + &": {
    marginTop: theme.spacing(4),
  },
  "& .MuiOutlinedInput-notchedOutline": {
    border: 0,
  },
}));

export const AutocompleteWithChips = ({
  placeholder,
  options: {
    data,
    removeChip,
    label,
    disabled,
    options,
    onAutocompleteChange,
  },
}: any) => {

  const [isInputFocused, setInputFocus] = useState(false);

    const handleDelete = (id: number) => {
    removeChip(id);
  };

const handleDeleteAll = () => {
    data.forEach((ele: { id: number, label: string }) => {
        handleDelete(ele.id);
    });
    };

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
        onChange={(e, value) => onAutocompleteChange(e, value)}
        freeSolo
        defaultValue={options.length>0 ? [options[0].label]: [{}]}
        renderTags={(value:any, getTagProps) => data.map((ele:{id:number, label:string}, index: number) => (
            <Chip
              {...getTagProps({ index })}
              deleteIcon={<ClearOutlinedIcon />}
              variant="outlined"
              label={ele.label}
              key={ele.id}
              onDelete={() => handleDelete(ele.id)}
              sx={{
                border: `1px solid ${buttonOutlinedBorderColor}`,
                borderRadius: "6px",
                margin: "4px",

                "& .MuiChip-label": {
                  color: buttonOutlinedColor,
                  fontSize: "14px",
                },
                "& .MuiChip-deleteIcon": {
                  color: grey400,
                  fontSize: "14px",
                },
              }}
            />
          ))
        }
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
                                    handleDeleteAll();
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
