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

function NoResults() {
    return <Box sx={{display: "flex", alignItems: "center", flexDirection: "column"}}>
        <Typography>No duplicates found</Typography>
        <Typography>We couldn’t find any record with these origin and destination in the database.</Typography>
        <Button variant="outlined">Clear Search</Button>
    </Box>
}

function NoSearch() {
    return <Box sx={{display: "flex", flexGrow: 1, justifyContent: "center", alignItems: "center"}}>
        <Typography>Add origin and destination to find duplicates</Typography>
    </Box>
}

export default function CheckDuplicates() {
    const [open, setOpen] = React.useState(false);
    const [hasSearchHappened, setHasSearchHappened] = React.useState<boolean>(false)

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleSearch = (event: any) => {
        setHasSearchHappened(true);
    }

    const listComponent = hasSearchHappened ? NoResults() : NoSearch()

    return (
        <div>
            <Button variant="text" onClick={handleClickOpen}>
                <Box sx={{display: "flex", alignItems: "center"}}>
                    <ManageSearchIcon/> Check for duplicates
                </Box>
            </Button>
            <Dialog
                open={open}
                onClose={handleClose}
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

                <DialogContent sx={{backgroundColor: "#F9FAFB", display:"flex", flexDirection: "column"}}>
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
                        <TextField select variant={"outlined"} fullWidth label="Select origin"
                                   sx={{
                                       paddingLeft: "1em",
                                       paddingRight: "1em"
                                   }}
                                   InputLabelProps={{shrink: false, sx: {paddingLeft: "1em"}}}
                                   SelectProps={{
                                       IconComponent: () => <ExpandMoreIcon />,
                                   }}
                        >
                        </TextField>
                        <Box sx={{
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
                            flexGrow: 0
                        }}>
                            <SwapHorizIcon sx={{color: "#548CE5"}}/>
                        </Box>
                        <TextField select variant={"outlined"} fullWidth label="Select destination"
                                   sx={{
                                       paddingLeft: "1em",
                                       paddingRight: "1em"
                                   }}
                                   InputLabelProps={{shrink: false, sx: {paddingLeft: "1em"}}}
                                   SelectProps={{
                                       IconComponent: () => <ExpandMoreIcon />,
                                   }}
                        >


                        </TextField>
                        <Button variant="contained" sx={{minWidth: "14em"}}
                                onClick={(event) => handleSearch(event)}>
                            Check for duplicates
                        </Button>
                    </Box>

                    {listComponent}
                </DialogContent>
            </Dialog>
        </div>
    );
}