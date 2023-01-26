import React, {useEffect, useLayoutEffect, useRef} from 'react'
import { useNavigate } from "react-router-dom";

import validator from "@rjsf/validator-ajv8";
import {UiSchema} from "@rjsf/utils";
import {withTheme} from "@rjsf/core";
import {Box} from '@mui/material';
import {Theme} from '@rjsf/mui'
import {hiddenWidget} from '../../helpers/helpers';
import useAutoSave from "../../hooks/useAutosave";
import {editSentence, retrieveSentence} from "../../services/SentenceService";

const Form = withTheme(Theme);

const log = (type: string) => console.log.bind(console, type);

const sentenceSchema = require("../../schemas/Sentence.json")

const excludedFields: string[] = [
    'id', 'modified_date', 'owner', 'pmcid', 'pmcid_uri', 'pmid_uri'
]

const uiSchema: UiSchema = {
    "ui:submitButtonOptions": {
        "norender": true,
    },
    ...hiddenWidget(excludedFields),
    'ui:order': ['text', 'title', 'pmid', 'state', 'doi', 'tags', 'available_transitions', ...excludedFields],
};


const SentenceForm = (props: any) => {

    const [sentence, setSentence] = React.useState();
    const sentenceRef = useRef();
    let navigate = useNavigate();
    let form: any;

    const fetchSentence = async (id: number) => {
        const response = await retrieveSentence(id)
        setSentence(response)
    }

    const updateSentence = async (id: number) => {
        // FIXME: Don't update on first render
        if(sentenceRef.current !== null){
            // FIXME: endpoint is a PATCH but we are sending the whole object
            await editSentence(id, sentenceRef.current)
        }
    }


    useEffect(() => {
        fetchSentence(Number(props.sentenceId))
        return () => {
            updateSentence(props.sentenceId)
        }
    }, [])


    // TODO: Create hook
    useEffect(() => {
        sentenceRef.current = sentence;
    }, [sentence]);


    // FIXME: Warning: Cannot update a component (`SentenceForm`) while rendering a different component (`SentenceForm`).
    const savingState = useAutoSave(() => updateSentence(props.sentenceId), sentence);


    return (
        <Box p={2}>
            <p>{savingState as string}</p>
            <Form
                ref={(f) => {
                    form = f
                }}
                schema={sentenceSchema}
                uiSchema={uiSchema}
                formData={sentence}
                onChange={e => setSentence(e.formData)}
                validator={validator}
                onError={log("errors")}
            />
            <>
                <button onClick={() => navigate(-1)}>Back</button>
            </>
        </Box>
    )
}

export default SentenceForm