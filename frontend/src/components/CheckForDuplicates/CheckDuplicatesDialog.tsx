import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import Box from "@mui/material/Box";
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CloseIcon from '@mui/icons-material/Close';
import {GridRowsProp} from "@mui/x-data-grid";
import {useState} from "react";
import {Fab} from "@mui/material";
import {AnatomicalEntity, PaginatedConnectivityStatementList} from "../../apiclient/backend";
import {duplicatesRowsPerPage, duplicatesSelectRowsPerPage} from "../../helpers/settings";
import ResultsGrid from "./ResultsGrid";
import NoResults from "./NoResults";
import NoSearch from "./NoSearch";
import {composerApi as api} from "../../services/apis";
import AutoComplete from "../AutoComplete";


type criteria =
    | ("pmid" | "-pmid")[]
    | undefined;

export default function CheckDuplicates() {
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [origin, setOrigin] = React.useState<AnatomicalEntity | undefined>(undefined);
    const [destination, setDestination] = React.useState<AnatomicalEntity | undefined>(undefined);
    const [statementsList, setStatementsList] = useState<PaginatedConnectivityStatementList>();
    const [currentPage, setCurrentPage] = useState(0);
    const [sorting, setSorting] = useState<criteria>(undefined);

    const fetchDuplicates = (
        ordering?: criteria,
        index?: number,
    ) => {
        if (origin && destination) {
            api.composerConnectivityStatementList(
                destination.id,
                undefined,
                duplicatesRowsPerPage,
                undefined,
                index,
                ordering || sorting,
                origin.id,
            )
                .then((res: { data: React.SetStateAction<PaginatedConnectivityStatementList | undefined>; }) => {
                    setStatementsList(res.data);
                    setSorting(ordering);
                });
        } else {
            setStatementsList(undefined)
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
            const {field, sort} = model[0];
            const sortingCriteria = `${field} ${sort}`;
            if (sortingCriteria === "pmid asc") {
                ordering = ["pmid"];
            } else if (sortingCriteria === "pmid desc") {
                ordering = ["-pmid"];
            }
        }
        fetchDuplicates(ordering);
        setCurrentPage(0);
    };

    const swapEntities = () => {
        const temp = origin
        setOrigin(destination)
        setDestination(temp)
    }

    const handleClearSearch = () => {
        setOrigin(undefined)
        setDestination(undefined)
        setStatementsList(undefined)
    }

    const handleClose = () => {
        setDialogOpen(false)
        handleClearSearch()
    }

    const rows: GridRowsProp =
        statementsList?.results?.map((statement) => {
            const {id, sentence, knowledge_statement, state} = statement;
            return {
                id,
                pmid: sentence.pmid,
                knowledge_statement,
                state,
            };
        }) || [];

    const results = statementsList ?
        statementsList.count == 0 ? NoResults({handleClearSearch: () => handleClearSearch()}) :
            ResultsGrid({
                rows,
                totalResults: statementsList.count,
                handlePageChange,
                handleSortModelChange,
                currentPage
            }) :
        NoSearch()

    const autoCompleteFetch = (inputValue: string) => api.composerAnatomicalEntityList(duplicatesSelectRowsPerPage, inputValue, 0)
    const autoCompleteNoOptionsText = "No entities found"

    return (
        <Box>
            <Button variant="text" onClick={() => setDialogOpen(true)}>
                <Box sx={{display: "flex", alignItems: "center"}}>
                    <ManageSearchIcon/> Check for duplicates
                </Box>
            </Button>
            <Dialog
                open={dialogOpen}
                onClose={() => {
                    handleClose()
                }}
                PaperProps={{
                    sx: {
                        minWidth: "50%",
                        minHeight: "50%"
                    }
                }}
            >
                <DialogTitle sx={{display: 'flex', alignItems: 'center', borderBottom: "1px solid #EAECF0"}}>
                    <Box>
                        <Typography variant="h5">
                            Check fo duplicates
                        </Typography>
                        <Typography>
                            Use smart search tool to find eventual duplicates of a record.
                        </Typography>
                    </Box>
                    <IconButton sx={{ml: 'auto'}}>
                        <CloseIcon onClick={() => handleClose()}/>
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{backgroundColor: "#F9FAFB", display: "flex", flexDirection: "column"}}>
                    <Box sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingTop: "1em",
                        paddingBottom: "1em",
                        paddingRight: "1em",
                        marginTop: "1em",
                        marginBottom: "1em",
                        borderRadius: "1em",
                        backgroundColor: "white",
                        boxShadow: "0px 12px 16px -4px rgba(16, 24, 40, 0.08), 0px 4px 6px -2px rgba(16, 24, 40, 0.03)",
                        border: "1px solid #EAECF0"
                    }}>
                        <AutoComplete placeholder="Select origin"
                                      setValue={(value: AnatomicalEntity) => setOrigin(value)}
                                      value={origin}
                                      fetch={autoCompleteFetch}
                                      noOptionsText={autoCompleteNoOptionsText}
                        />
                        <Fab sx={{
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
                            boxShadow: "none"
                        }} onClick={() => swapEntities()}>
                            <SwapHorizIcon sx={{color: "#548CE5"}}/>
                        </Fab>
                        <AutoComplete placeholder="Select destination"
                                      setValue={(value: AnatomicalEntity) => setDestination(value)}
                                      value={destination}
                                      fetch={autoCompleteFetch}
                                      noOptionsText={autoCompleteNoOptionsText}
                        />
                        <Button variant="contained" sx={{minWidth: "14em"}}
                                onClick={() => fetchDuplicates()}>
                            Check for duplicates
                        </Button>
                    </Box>

                    {results}
                </DialogContent>
            </Dialog>
        </Box>
    );
}