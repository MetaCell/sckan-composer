import React, {useRef, useState} from 'react'
import validator from "@rjsf/validator-ajv8";
import {IChangeEvent, withTheme} from "@rjsf/core";
import {Box} from '@mui/material';
import {Theme} from '@rjsf/mui'
import {useDebouncedCallback} from "use-debounce";
import {INPUT_DEFAULT_DELAY} from "../../settings";

const Form = withTheme(Theme)

const log = (type: string) => console.log.bind(console, type)


export const FormBase = (props: any) => {

    const {service, data, schema, setter, extraData, uiSchema, uiFields, enableAutoSave} = props
    const triggerAutoSave = useDebouncedCallback(() => onSave(), INPUT_DEFAULT_DELAY);


    const formRef = useRef<any>(null);

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
    }

    const onSave = () => {
        // todo: Disable form
        if (formRef.current != null) {
            console.debug("Saving")
            return formRef.current.submit()
        }
    }

    const handleSubmit = async (event: IChangeEvent) => {
        const formData = {...event.formData, ...extraData}
        service.save(formData).then((newData: any) => {
            setter(newData)
        }).catch((error: any) => console.error("Something went wrong"))
        console.debug("Saved")
    }

    const handleUpdate = async (event: IChangeEvent) => {
        if (enableAutoSave) {
            console.debug("Triggered Auto Save")
            return triggerAutoSave()
        }
    }

    return (
        <Box p={2}>
            <Form
                ref={formRef}
                schema={schema}
                uiSchema={uiSchema}
                formData={data}
                validator={validator}
                onChange={handleUpdate}
                onSubmit={handleSubmit}
                onError={onError}
            />
        </Box>
    )
}
