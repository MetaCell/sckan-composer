import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import Box from "@mui/material/Box";
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {DataGrid, GridColDef, GridEventListener, GridRowsProp} from "@mui/x-data-grid";
import {useEffect, useMemo, useState} from "react";
import {AnatomicalEntity, PaginatedConnectivityStatementWithDetailsList} from "../apiclient/backend";
import {composerApi as api} from "../services/apis";
import {useNavigate} from "react-router-dom";
import {Autocomplete, CircularProgress, debounce, Fab} from "@mui/material";
import {SEARCH_DEBOUNCE} from "../settings";

const columns: GridColDef[] = [
    {field: "pmid", headerName: "PMID"},
    {field: "state", headerName: "Status", sortable: false, flex: 1},
    {field: "knowledge_statement", headerName: "Connectivity Statement", sortable: false, flex: 2},
];

const rowsPerPage = 10;
const selectRowsPerPage = 100;

function ResultsGrid({rows, totalResults, handlePageChange, handleRowClick, handleSortModelChange, currentPage}: any) {
    return <Box flexGrow={1} height="calc(100vh - 325px)">
        <DataGrid
            rows={rows}
            columns={columns}
            getRowHeight={() => "auto"}
            pageSize={rowsPerPage}
            paginationMode="server"
            sortingMode="server"
            rowCount={totalResults}
            onPageChange={handlePageChange}
            onRowClick={handleRowClick}
            onSortModelChange={handleSortModelChange}
            rowsPerPageOptions={[rowsPerPage]}
            page={currentPage}
            disableColumnMenu
        />
    </Box>
}

function NoResults() {
    return <Box
        sx={{display: "flex", flexGrow: 1, justifyContent: "center", alignItems: "center", flexDirection: "column"}}>
        <Box sx={{
            display: "flex",
            flexGrow: 1,
            justifyContent: "center",
            alignItems: "center",
            maxWidth: "25em",
            flexDirection: "column"
        }}>
            <Typography variant="h6">No duplicates found</Typography>
            <Typography sx={{textAlign: "center"}}>We couldn’t find any record with these origin and destination in the
                database.</Typography>
        </Box>
        <Button sx={{marginBottom: "3em", color: "#344054", border: "1px solid #D0D5DD"}} variant="outlined">Clear
            Search</Button>
    </Box>
}

function NoSearch() {
    return <Box sx={{display: "flex", flexGrow: 1, justifyContent: "center", alignItems: "center"}}>
        <Typography>Add origin and destination to find duplicates</Typography>
    </Box>
}

function AnatomicalEntityAutoComplete({placeholder, ...props}: any) {
    const [value, setValue] = React.useState<AnatomicalEntity | null>(null);
    const [inputValue, setInputValue] = useState<string>("")
    const [options, setOptions] = useState<readonly AnatomicalEntity[]>([]);


    const handleInputChange = (inputValue: string) => {
        setInputValue(inputValue)
    }

    const fetchEntities = React.useMemo(
        () =>
            debounce(
                () => {
                    api.composerAnatomicalEntityList(
                        selectRowsPerPage,
                        inputValue,
                        // todo: Add infinite scroll?
                        0
                    ).then(res => {
                        const {data} = res
                        const {results} = data
                        let entities = results
                        if (!entities) {
                            entities = []
                        }
                        setOptions(entities)
                    })
                }, SEARCH_DEBOUNCE,
            ),
        [inputValue],
    );


    useEffect(() => {
        fetchEntities()
    }, [inputValue, value, fetchEntities])

    return (
        <Autocomplete
            sx={{
                paddingLeft: "1em",
                paddingRight: "1em"
            }}
            fullWidth
            popupIcon={<ExpandMoreIcon/>}

            getOptionLabel={(option) =>
                typeof option === 'string' ? option : option.name
            }
            filterOptions={(x) => x}
            options={options}
            autoComplete
            includeInputInList
            filterSelectedOptions
            value={value}
            noOptionsText="No entities found"
            onChange={(event: any, newValue: AnatomicalEntity | null) => {
                setOptions(newValue ? [newValue, ...options] : options);
                setValue(newValue);
            }}
            onInputChange={(e, v) => handleInputChange(v)}
            renderInput={(params) => (
                <TextField {...params} placeholder={placeholder} fullWidth />
            )}

        />
    );
}


type criteria =
    | ("pmid" | "-pmid")[]
    | undefined;

export default function CheckDuplicates() {
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [origin, setOrigin] = React.useState<number | undefined>(undefined);
    const [destination, setDestination] = React.useState<number | undefined>(undefined);
    const [statementsList, setStatementsList] = useState<PaginatedConnectivityStatementWithDetailsList>();
    const [currentPage, setCurrentPage] = useState(0);
    const [sorting, setSorting] = useState<criteria>(undefined);
    const navigate = useNavigate();

    const fetchDuplicates = (
        ordering?: criteria,
        index?: number,
    ) => {
        if (origin && destination) {
            api.composerConnectivityStatementList(
                destination,
                undefined,
                rowsPerPage,
                undefined,
                index,
                ordering || sorting,
                origin,
            )
                .then((res) => {
                    setStatementsList(res.data);
                    setSorting(ordering);
                });
        }

    };

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
        const index = newPage * rowsPerPage;
        fetchDuplicates(sorting, index);
    };

    const handleRowClick: GridEventListener<"rowClick"> = (params) => {
        navigate(`statement/${params.row.id}`);
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

    const rows: GridRowsProp =
        statementsList?.results?.map((statement) => {
            const {id, sentence, knowledge_statement, state} = statement;
            return {
                id,
                // todo: change id to sentence.pmid
                pmid: id,
                knowledge_statement,
                state,
            };
        }) || [];

    const results = statementsList ?
        statementsList.count == 0 ? NoResults() :
            ResultsGrid({
                rows,
                totalResults: statementsList.count,
                handlePageChange,
                handleRowClick,
                handleSortModelChange,
                currentPage
            }) :
        NoSearch()

    return (
        <div>
            <Button variant="text" onClick={() => setDialogOpen(true)}>
                <Box sx={{display: "flex", alignItems: "center"}}>
                    <ManageSearchIcon/> Check for duplicates
                </Box>
            </Button>
            <Dialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                PaperProps={{
                    sx: {
                        minWidth: "50%",
                        minHeight: "50%"
                    }
                }}
            >
                <DialogTitle sx={{display: 'flex', alignItems: 'center'}}>
                    <Box>
                        <Typography variant="h5">
                            Check fo duplicates
                        </Typography>
                        <Typography>
                            Use smart search tool to find eventual duplicates of a record.
                        </Typography>
                    </Box>
                    <IconButton sx={{ml: 'auto'}}>
                        <CloseIcon onClick={() => setDialogOpen(false)}/>
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
                        <AnatomicalEntityAutoComplete placeholder="Select origin"/>
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
                        <AnatomicalEntityAutoComplete placeholder="Select destination"/>
                        <Button variant="contained" sx={{minWidth: "14em"}}
                                onClick={() => fetchDuplicates()}>
                            Check for duplicates
                        </Button>
                    </Box>

                    {results}
                </DialogContent>
            </Dialog>
        </div>
    );
}