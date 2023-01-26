import React, {useEffect, useState} from 'react'
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import {useParams} from "react-router-dom";
import SentenceForm from './Forms/SentenceForm';
import NoteForm from './Forms/NoteForm';
import StatementForm from './Forms/StatementForm';

const excludedStatementFields = ['destination', 'destination_type', 'origin', 'path', 'state', 'tags', 'available_transitions']

const ReducedStatementForm = (props: any) => {

    const formData = {sentence: Number(props.sentenceId)}

    return (
        <StatementForm formData={formData} excludedFields={excludedStatementFields}/>
    )
}


const SentencesDetails = () => {
    const {sentenceId} = useParams();
    const [extraStatementForm, setExtraStatementForm] = useState<string[]>([])


    return (
        <Grid p={12} container justifyContent='center'>
            <Grid item xl={12}>
                <Paper elevation={0} sx={{padding: 8}}>
                    <Stack alignItems='center' spacing={4}>
                        <Box textAlign='center'>
                            <Typography variant='h3' marginBottom={1.5}>
                                Sentence Details
                            </Typography>
                            <Typography variant='subtitle2'>
                                Show the sentence with id {sentenceId} details here
                            </Typography>
                        </Box>
                    </Stack>
                </Paper>
            </Grid>
            <Grid item xl={7}>
                <SentenceForm sentenceId={sentenceId}/>
                <ReducedStatementForm sentenceId={sentenceId}/>
                {extraStatementForm.map(() => (<ReducedStatementForm sentenceId={sentenceId}/>))}
                <Button onClick={() => setExtraStatementForm((prev) => [...prev, ''])}>Add Statement</Button>
            </Grid>
            <Grid item xl={5}>
                <NoteForm/>
            </Grid>
        </Grid>
    )
}

export default SentencesDetails