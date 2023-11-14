import * as React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import { GridRowsProp } from "@mui/x-data-grid";
import { useState } from "react";
import { Fab } from "@mui/material";
import {
  AnatomicalEntity,
  PaginatedConnectivityStatementList,
} from "../../apiclient/backend";
import {
  duplicatesRowsPerPage,
  autocompleteRows,
} from "../../helpers/settings";
import ResultsGrid from "./ResultsGrid";
import NoResults from "./NoResults";
import NoSearch from "./NoSearch";
import { composerApi as api } from "../../services/apis";
import AutoComplete from "../AutoComplete";

type criteria = ("id" | "-id")[] | undefined;

export default function CheckDuplicates() {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [origin, setOrigin] = React.useState<number[] | undefined | []>([]);
  const [destination, setDestination] = React.useState<any>("");
  const [statementsList, setStatementsList] =
    useState<PaginatedConnectivityStatementList>();
  const [currentPage, setCurrentPage] = useState(0);
  const [sorting, setSorting] = useState<criteria>(undefined);

  const fetchDuplicates = (ordering?: criteria, index?: number) => {
    if (origin || destination) {
      api
        .composerConnectivityStatementList(
          destination ? destination.id : undefined,
          undefined,
          undefined,
          duplicatesRowsPerPage,
          undefined,
          index,
          ordering || sorting,
          origin ? origin : undefined,
        )
        .then(
          (res: {
            data: React.SetStateAction<
              PaginatedConnectivityStatementList | undefined
            >;
          }) => {
            setStatementsList(res.data);
            setSorting(ordering);
          },
        );
    } else {
      setStatementsList(undefined);
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    const index = newPage * duplicatesRowsPerPage;
    fetchDuplicates(sorting, index);
  };

  const handleSortModelChange = (model: any) => {
    let ordering: criteria;
    if (model.length === 0) {
      ordering = undefined;
    } else {
      const { field, sort } = model[0];
      const sortingCriteria = `${field} ${sort}`;
      if (sortingCriteria === "id asc") {
        ordering = ["id"];
      } else if (sortingCriteria === "id desc") {
        ordering = ["-id"];
      }
    }
    fetchDuplicates(ordering);
    setCurrentPage(0);
  };

  const swapEntities = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const handleClearSearch = () => {
    setOrigin(undefined);
    setDestination(undefined);
    setStatementsList(undefined);
  };

  const handleClose = () => {
    setDialogOpen(false);
    handleClearSearch();
  };

  const rows: GridRowsProp =
    statementsList?.results?.map((statement) => {
      const { id, sentence, knowledge_statement, state } = statement;
      return {
        id,
        knowledge_statement,
        state,
      };
    }) || [];

  const results = statementsList
    ? statementsList.count == 0
      ? NoResults({ handleClearSearch: () => handleClearSearch() })
      : ResultsGrid({
          rows,
          totalResults: statementsList.count,
          handlePageChange,
          handleSortModelChange,
          currentPage,
        })
    : NoSearch();

  const autoCompleteFetch = (inputValue: string) =>
    api.composerAnatomicalEntityList([], autocompleteRows, inputValue, 0);
  const autoCompleteNoOptionsText = "No entities found";

  return (
    <Box>
      <Button variant="text" onClick={() => setDialogOpen(true)}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <ManageSearchIcon /> Check for duplicates
        </Box>
      </Button>
      <Dialog
        open={dialogOpen}
        onClose={() => {
          handleClose();
        }}
        PaperProps={{
          sx: {
            minWidth: "50%",
            minHeight: "50%",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            borderBottom: "1px solid #EAECF0",
          }}
        >
          <Box>
            <Typography variant="h5">Check fo duplicates</Typography>
            <Typography>
              Use smart search tool to find eventual duplicates of a record.
            </Typography>
          </Box>
          <IconButton sx={{ ml: "auto" }} onClick={() => handleClose()}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent
          sx={{
            backgroundColor: "#F9FAFB",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Stack
            direction="row"
            spacing={1}
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              p: 2,
              marginTop: "1em",
              marginBottom: "1em",
              borderRadius: "1em",
              backgroundColor: "white",
              boxShadow:
                "0px 12px 16px -4px rgba(16, 24, 40, 0.08), 0px 4px 6px -2px rgba(16, 24, 40, 0.03)",
              border: "1px solid #EAECF0",
            }}
          >
            <AutoComplete
              multiple
              placeholder="Select origin"
              setValue={(value: any) => setOrigin(value)}
              value={origin}
              fetch={autoCompleteFetch}
              noOptionsText={autoCompleteNoOptionsText}
            />
            <Fab
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                padding: "1em",
                height: "3em",
                width: "3em",
                background: "#E2ECFB",
                border: "1px solid #E2ECFB",
                borderRadius: "100px",
                flex: "none",
                flexGrow: 0,
                boxShadow: "none",
              }}
              onClick={() => swapEntities()}
            >
              <SwapHorizIcon sx={{ color: "#548CE5" }} />
            </Fab>
            <AutoComplete
              placeholder="Select destination"
              setValue={(value: any) => setDestination(value)}
              value={destination}
              fetch={autoCompleteFetch}
              noOptionsText={autoCompleteNoOptionsText}
            />
            <Button
              variant="contained"
              sx={{ minWidth: "14em" }}
              onClick={() => fetchDuplicates()}
            >
              Check for duplicates
            </Button>
          </Stack>

          {results}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
