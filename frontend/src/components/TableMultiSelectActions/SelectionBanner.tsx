import type React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import Collapse from "@mui/material/Collapse";
import { vars } from "../../theme/variables";
import {useEffect} from "react";

const styles = {
  selectionBanner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1rem",
    borderRight: `1px solid ${vars.gray200}`,
    borderLeft: `1px solid ${vars.gray200}`,
    borderBottom: `1px solid ${vars.gray200}`,
    backgroundColor: vars.whiteColor,
    gap: ".25rem",
  },
  link: {
    color: vars.darkBlue,
    textDecoration: "none",
    fontWeight: 600,
  }
};

interface SelectionBannerProps {
  totalResults: number;
  show: boolean;
  entityType?: string;
  setIsAllDataSelected: (isAllDataSelected: boolean) => void;
  setNotIsAllDataSelected: (isAllDataSelected: boolean) => void;
  isAllDataSelected: boolean;
}

const SelectionBanner: React.FC<SelectionBannerProps> = ({ totalResults, show, entityType, setIsAllDataSelected, isAllDataSelected, setNotIsAllDataSelected }) => {
  const handleSelectAll = () => {
    if (setNotIsAllDataSelected) {
      setIsAllDataSelected(true)
      setNotIsAllDataSelected(false)
    }
  }
    const handleUndo = () => {
    if (setIsAllDataSelected) {
      setNotIsAllDataSelected(true)
      setIsAllDataSelected(false)
    }
  }
  
  useEffect(() => {
    return () => {
      setNotIsAllDataSelected(false)
      setIsAllDataSelected(false)
    }
  }, [])
  
  return (
    <Collapse in={show} timeout={400}>
      <Box sx={styles.selectionBanner}>
        <Typography color={vars.darkTextColor} noWrap>
          All the {entityType}s on this page are selected.
        </Typography>
        {
          isAllDataSelected ? (
            <Link
              component="button"
              variant="body2"
              onClick={handleUndo}
              sx={styles.link}
            >
              undo
            </Link>
          ) : <Link
            component="button"
            variant="body2"
            onClick={handleSelectAll}
            sx={styles.link}
          >
            Select all {totalResults} {entityType}
          </Link>
        }
        
      </Box>
    </Collapse>
  );
};

export default SelectionBanner;
