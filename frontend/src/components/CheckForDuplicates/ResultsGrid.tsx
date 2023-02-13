import {Chip, Theme, useTheme} from "@mui/material";
import {DataGrid, GridColDef, GridRenderCellParams} from "@mui/x-data-grid";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import * as React from "react";
import {connectivityStatementStateColorMapping, duplicatesRowsPerPage} from "../../helpers/settings";
import {snakeToSpace} from "../../helpers/helpers";

type severity =
    | ("default" | "info" | "success" | "error" | "warning" | "primary" | "secondary")
    | undefined;

export default function ResultsGrid({rows, totalResults, handlePageChange, handleSortModelChange, currentPage}: any) {
    const theme = useTheme<Theme>()
    const getChipColor = (state: string | undefined, background: boolean) => {
        if (!state) {
            return theme.palette.primary.main
        }
        const severity = connectivityStatementStateColorMapping[state as keyof typeof connectivityStatementStateColorMapping] as severity;
        switch (severity) {
            case "info":
                return background ? theme.palette.info.light : theme.palette.info.main;
            case "success":
                return background ? theme.palette.success.light : theme.palette.success.main;
            case "warning":
                return background ? theme.palette.warning.light : theme.palette.warning.main
            case "error":
                return background ? theme.palette.error.light : theme.palette.error.main
            default:
                return background ? theme.palette.primary.light : theme.palette.primary.main
        }
    }

    const columns: GridColDef[] = [
        {
            field: "pmid", headerName: "PMID",
            headerClassName: 'grid--header',
            renderCell:
                (params: GridRenderCellParams<string>) => (
                    <Box sx={{padding: "1em"}}>
                        <Typography variant={"h6"}>{params.value}</Typography>
                    </Box>
                )
        },
        {
            field: "state", headerName: "Status", sortable: false, flex: 1,
            headerClassName: 'grid--header',
            renderCell:
                (params: GridRenderCellParams<string>) => (
                    <Box sx={{padding: "0.2em 0.7em"}}>
                        <Chip sx={{
                            color: getChipColor(params.value, false),
                            backgroundColor: getChipColor(params.value, true)
                        }} label={snakeToSpace(params.value||'')}/>
                    </Box>
                )
        },
        {
            field: "knowledge_statement", headerName: "Connectivity Statement", sortable: false, flex: 2,
            headerClassName: 'grid--header',
            renderCell:
                (params: GridRenderCellParams<string>) => (
                    <Box sx={{padding: "1em"}}>
                        <Typography>{params.value}</Typography>
                    </Box>
                )
        },
    ];
    const resultStr = totalResults != 1 ? "Results" : "Result";
    return <Box sx={{
                    flexGrow: 1,
                    height: 'calc(100vh - 125px)',
                    '& .grid--header': {
                        fontSize: '1em',
                    },
                }}>
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