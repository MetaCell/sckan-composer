import * as React from "react";
import Box from "@mui/material/Box";
import {
  gridPageCountSelector,
  gridPageSelector,
  useGridApiContext,
  useGridSelector,
} from "@mui/x-data-grid";
import Pagination from "@mui/material/Pagination";
import PaginationItem from "@mui/material/PaginationItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

const overlayerHeight = 3;

const Prev = () => (
  <Stack direction="row" spacing={1.5}>
    <ArrowBackIcon fontSize="small" />
    <Typography variant="h6">Previous</Typography>
  </Stack>
);

const Next = () => (
  <Stack direction="row" spacing={1.5}>
    <Typography variant="h6">Next</Typography>
    <ArrowForwardIcon fontSize="small" />
  </Stack>
);

export default function CustomPagination() {
  const apiRef = useGridApiContext();
  const page = useGridSelector(apiRef, gridPageSelector);
  const pageCount = useGridSelector(apiRef, gridPageCountSelector);

  return (
    <Box
      display="flex"
      flexGrow={1}
      flexDirection="column"
      mt={-overlayerHeight}
    >
      <Box
        width="100%"
        sx={{
          background:
            "linear-gradient(to bottom, rgba(255,255,255,0),rgba(255,255,255,1))",
          zIndex: 2,
          height: 8 * overlayerHeight,
        }}
      />
      <Pagination
        variant="text"
        count={pageCount}
        page={page + 1}
        siblingCount={1}
        boundaryCount={1}
        onChange={(event, value) => apiRef.current.setPage(value - 1)}
        sx={{
          flex: 1,
          px: 3,
          py: 2,
          borderTop: "1px solid rgba(224, 224, 224, 1)",
        }}
        renderItem={(item) => (
          <PaginationItem slots={{ previous: Prev, next: Next }} {...item} />
        )}
      />
    </Box>
  );
}
