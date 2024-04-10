import {Box, Chip, Tooltip} from "@mui/material";
import {Option} from "../../types";
import ClearOutlinedIcon from "@mui/icons-material/ClearOutlined";
import React from "react";
const CustomChipBoxComponent = ({
   selectedOptions,
   CustomInputChip,
   styles,
   isDisabled,
   handleChipRemove,
   chipsNumber,
}: any) => {
  const extraChipStyle = !isDisabled ?
    { flex: 1,
      minWidth: 0,
      maxWidth: "fit-content",
      cursor: "pointer"
    }:
    {cursor:  "initial",
      width: 'fit-content',
      maxWidth: 'fit-content',
    }
  
  const renderChipOrCustomInput = (item: Option) => (
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
          sx={{
            ...styles.chip,
            ...extraChipStyle
          }}
          variant={"outlined"}
          onClick={(e) => {
            e.stopPropagation();
          }}
          deleteIcon={<ClearOutlinedIcon />}
          onDelete={!isDisabled ? (e) => {
            e.stopPropagation();
            handleChipRemove(item);
          } : undefined}
          label={item?.label}
        />
      )}
    </Tooltip>
  );
  
  
  return (
    <Box gap={1} display="flex" flexWrap="wrap" alignItems="center">
      {!isDisabled && selectedOptions?.length ? (
        selectedOptions
          .slice(0, chipsNumber)
          .map((item: Option) => renderChipOrCustomInput(item))
      ) : (
        selectedOptions?.map((item: Option) => renderChipOrCustomInput(item))
      )}
      {!isDisabled && selectedOptions.length > chipsNumber && (
        <span style={{ marginRight: ".5rem" }}>
          +{selectedOptions.length - chipsNumber}
        </span>
      )}
    </Box>
  );
};

export default CustomChipBoxComponent