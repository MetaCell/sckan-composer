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
import {
    DataGrid,
    GridColDef,
    GridEventListener,
    GridRenderCellParams,
    GridRowsProp
} from "@mui/x-data-grid";
import {useEffect, useState} from "react";
import {AnatomicalEntity, PaginatedConnectivityStatementList} from "../apiclient/backend";
import {composerApi as api} from "../services/apis";
import {useNavigate} from "react-router-dom";
import {Autocomplete, Chip, debounce, Fab} from "@mui/material";
import {SEARCH_DEBOUNCE} from "../settings";
import {
    connectivityStatementStateColorMapping,
    duplicatesRowsPerPage,
    duplicatesSelectRowsPerPage
} from "../helpers/settings";


type chipColor =
    | ("default" | "info" | "success" | "error" | "warning" | "primary" | "secondary")
    | undefined;

function getStateColor(value: string | undefined) {
    let state = value
    if (!state) {
        state = "default"
    }
    return connectivityStatementStateColorMapping[state as keyof typeof connectivityStatementStateColorMapping] as chipColor;
}

const columns: GridColDef[] = [
    {
        field: "pmid", headerName: "PMID",
        renderCell:
            (params: GridRenderCellParams<string>) => (
                <Box sx={{padding: "1em"}}>
                    <Typography variant={"h6"}>{params.value}</Typography>
                </Box>
            )
    },
    {
        field: "state", headerName: "Status", sortable: false, flex: 1,
        renderCell:
            (params: GridRenderCellParams<string>) => (
                <Box sx={{padding: "1em"}}>
                    <Chip color={getStateColor(params.value)} label={params.value}/>
                </Box>
            )
    },
    {
        field: "knowledge_statement", headerName: "Connectivity Statement", sortable: false, flex: 2,
        renderCell:
            (params: GridRenderCellParams<string>) => (
                <Box sx={{padding: "1em"}}>
                    <Typography>{params.value}</Typography>
                </Box>
            )
    },
];

function ResultsGrid({rows, totalResults, handlePageChange, handleSortModelChange, currentPage}: any) {
    const resultStr = totalResults != 1 ? "Results" : "Result";
    return <Box flexGrow={1} height="calc(100vh - 125px)">
        <Typography sx={{paddingLeft: "1em", paddingBottom: "1em"}}>{totalResults} {resultStr}</Typography>
        <DataGrid
            sx={{height: "calc(100% - 2em)"}}
            rows={rows}
            columns={columns}
            getRowHeight={() => "auto"}
            pageSize={duplicatesRowsPerPage}
            paginationMode="server"
            sortingMode="server"
            rowCount={totalResults}
            onPageChange={handlePageChange}
            onSortModelChange={handleSortModelChange}
            rowsPerPageOptions={[duplicatesRowsPerPage]}
            page={currentPage}
            disableColumnMenu
        />
    </Box>
}

function NoResults({handleClearSearch}: any) {
    return <Box height="calc(100vh - 125px)"
                sx={{
                    display: "flex",
                    flexGrow: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    flexDirection: "column"
                }}>
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
        <Button sx={{marginBottom: "3em", color: "#344054", border: "1px solid #D0D5DD"}} variant="outlined"
                onClick={() => handleClearSearch()}>
            Clear Search
        </Button>
    </Box>
}

function NoSearch() {
    return <Box sx={{display: "flex", flexGrow: 1, justifyContent: "center", alignItems: "center"}}
                height="calc(100vh - 125px)">
        <Typography>Add origin and destination to find duplicates</Typography>
    </Box>
}

function AnatomicalEntityAutoComplete({placeholder, value, setValue, ...props}: any) {
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
                        duplicatesSelectRowsPerPage,
                        inputValue,
                        // todo: Add 'paginated' scroll?
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
    }, [inputValue, fetchEntities])


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
            isOptionEqualToValue={(option, value) => option.name === value.name}
            filterOptions={(x) => x}
            options={options}
            autoComplete
            includeInputInList
            filterSelectedOptions
            defaultValue={null}
            value={value || null}
            noOptionsText="No entities found"
            onChange={(event: any, newValue: AnatomicalEntity | null) => {
                setOptions(newValue ? [newValue, ...options] : options);
                setValue(newValue)
            }}
            onInputChange={(e, v) => handleInputChange(v)}
            renderInput={(params) => (
                <TextField {...params} placeholder={placeholder} fullWidth/>
            )}
        />
    );
}

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
    const navigate = useNavigate();

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
                .then((res) => {
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
                        <AnatomicalEntityAutoComplete placeholder="Select origin"
                                                      setValue={(value: AnatomicalEntity) => setOrigin(value)}
                                                      value={origin}
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
                        <AnatomicalEntityAutoComplete placeholder="Select destination"
                                                      setValue={(value: AnatomicalEntity) => setDestination(value)}
                                                      value={destination}
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