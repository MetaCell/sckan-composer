import React, {useEffect, useRef, useState} from 'react'
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

    const dataRef = useRef<any|null>();
    const {service, data, schema, setter, extraData, uiSchema, uiFields} = props
    const {debounce, resolve} = useAutoSave(() => onSave(), (value) => dataRef.current = value)
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

    const onError = (errors: any) => {
        log("errors")
        log(errors)
        resolve()
    }

    const onSave = async () => {
        if (formRef.current != null) {
            return formRef.current.submit()
        }
    }

    const handleSubmit = async (event: IChangeEvent) => {
        console.debug("Simulating save")
        console.debug(dataRef.current.title)
      const formData = {...event.formData, ...extraData}
      service.save(formData).then((newData:any) => {
        setter(newData)
      })
        console.debug("Simulating save concluded")
        resolve()
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
