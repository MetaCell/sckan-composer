import React, {useRef, useState} from 'react'
import validator from "@rjsf/validator-ajv8";
import {IChangeEvent, withTheme} from "@rjsf/core";
import {Backdrop, Box, CircularProgress} from '@mui/material';
import {Theme} from '@rjsf/mui'
import {useDebouncedCallback} from "use-debounce";
import {EDIT_DEBOUNCE} from "../../settings";

const Form = withTheme(Theme)

const log = (type: string) => console.log.bind(console, type)


export const FormBase = (props: any) => {

    const {service, data, schema, setter, extraData, uiSchema, uiFields, enableAutoSave, disabled=false,  clearOnSave=false, children = false, widgets, isUpdate} = props
    const [localData, setLocalData] = useState<any>(data)
    const [isSaving, setIsSaving] = useState<boolean>(false)
    const triggerAutoSave = useDebouncedCallback(() => onSave(), EDIT_DEBOUNCE);

    const formRef = useRef<any>(null);
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
        if (formRef.current != null) {
            return formRef.current.submit()
        }
    }

    const handleSubmit = async (event: IChangeEvent) => {
        const formData = {...event.formData, ...extraData}
        setIsSaving(true)
        setLocalData(formData)
        console.log(formData)
        if (isUpdate) {
            service.update(formData).then((newData: any) => {
                setter(newData)
                // todo: Add UI feedback
                log("Saved")
            }).catch((error: any) => {
                // todo: handle errors here
                log("Something went wrong")
            }).finally(() => {
                setIsSaving(false)
                if(clearOnSave){
                    setLocalData({})
                }
            })
        } else {
            service.save(formData).then((newData: any) => {
                setter(newData)
                // todo: Add UI feedback
                log("Saved")
            }).catch((error: any) => {
                // todo: handle errors here
                log("Something went wrong")
            }).finally(() => {
                setIsSaving(false)
                if(clearOnSave){
                    setLocalData({})
                }
            })
        }

    }

    const handleUpdate = async (event: IChangeEvent) => {
        if (enableAutoSave) {
            return triggerAutoSave()
        }
    }

    return (
      <>
        {(!data || isSaving) && <Backdrop
              open={isSaving}
          >
            <CircularProgress color="inherit"/>
        </Backdrop>
        }
        <Box p={2}>
            <Form
                ref={formRef}
                schema={schema}
                uiSchema={uiSchema}
                formData={localData}
                disabled={disabled}
                validator={validator}
                onChange={handleUpdate}
                onSubmit={handleSubmit}
                onError={onError}
                children={children}
                widgets={widgets}
            />
        </Box>
      </>
    )
}
