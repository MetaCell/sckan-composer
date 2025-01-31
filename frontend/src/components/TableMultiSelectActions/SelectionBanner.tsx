import type React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import Collapse from "@mui/material/Collapse";
import { vars } from "../../theme/variables";

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
}

const SelectionBanner: React.FC<SelectionBannerProps> = ({ totalResults, show, entityType }) => {
  const handleSelectAll = () => {
    // TODO: Implement the logic to select all sentences
    console.log(`Select all ${entityType}s...`);
  }
  
  return (
    <Collapse in={show} timeout={400}>
      <Box sx={styles.selectionBanner}>
        <Typography color={vars.darkTextColor} noWrap>
          All the {entityType}s on this page are selected.
        </Typography>
        <Link
          component="button"
          variant="body2"
          onClick={handleSelectAll}
          sx={styles.link}
        >
          Select all {totalResults} {entityType}
        </Link>
      </Box>
    </Collapse>
  );
};

export default SelectionBanner;
