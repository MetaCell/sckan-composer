import React, {useEffect, useRef} from 'react'
import validator from "@rjsf/validator-ajv8";
import {IChangeEvent, withTheme} from "@rjsf/core";
import {Box} from '@mui/material';
import {Theme} from '@rjsf/mui'
import useAutoSave from "../../hooks/useAutosave";
import {INPUT_DEFAULT_DELAY} from "../../settings";
import {delay} from "../../utilities/functions";

const Form = withTheme(Theme)

const log = (type: string) => console.log.bind(console, type)


export const FormBase = (props: any) => {

    const dataRef = useRef();
    const {data, schema, uiSchema, uiFields} = props
    const {debounce} = useAutoSave(() => onSave(), (value) => dataRef.current = value)
    const formRef = useRef<any>(null);

    useEffect(() => {
        dataRef.current = data;
    }, [data]);


    if (!data) {
        return <div>Loading...</div>
    }

    if (uiFields) {
        Object.entries(uiSchema).forEach((p) =>
            !p[0].startsWith("ui:") && !uiFields.includes(p[0])
                ? delete uiSchema[p[0]] && delete schema.properties[p[0]]
                : null
        )
    }

    const onSave = async () => {
        if (formRef.current != null) {
            // TODO: Its resolving immediately but it should wait for handleSubmit response
            return Promise.resolve(formRef.current.submit())
        }
    }

    const handleSubmit = async (event: IChangeEvent) => {
        await delay(INPUT_DEFAULT_DELAY * 2)
        console.log("submitted")
        console.log(event.formData)
    }

    const onError = (errors: any) => {
        log("errors")
        log(errors)
    }


    return (
        <Box p={2}>
            <Form
                ref={formRef}
                schema={schema}
                uiSchema={uiSchema}
                formData={dataRef.current || data}
                validator={validator}
                onChange={(e) => debounce(e.formData)}
                onSubmit={handleSubmit}
                onError={onError}
            />
        </Box>
    )
}
