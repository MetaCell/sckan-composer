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
    >
      <Pagination
        variant="text"
        count={pageCount}
        page={page + 1}
        siblingCount={1}
        boundaryCount={1}
        onChange={(event, value) => apiRef.current.setPage(value - 1)}
        renderItem={(item) => (
          <PaginationItem slots={{ previous: Prev, next: Next }} {...item} />
        )}
      />
    </Box>
  );
}
