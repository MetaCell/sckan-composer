import React, {useEffect, useRef} from 'react'
import validator from "@rjsf/validator-ajv8";
import { IChangeEvent, withTheme } from "@rjsf/core";
import { Box } from '@mui/material';
import { Theme } from '@rjsf/mui'
import useAutoSave from "../../hooks/useAutosave";

const Form = withTheme(Theme)

const log = (type: string) => console.log.bind(console, type)

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));


export const FormBase = (props: any) => {

  const dataRef = useRef();
  const { data, schema, uiSchema, uiFields } = props
  const { debounce } = useAutoSave(() => sleep(1000), (value) => dataRef.current = value)
  const submitFormRef = useRef<HTMLButtonElement|null>(null);

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

  const onSave = async (value: any) => {
    if(submitFormRef.current != null){
      submitFormRef.current.click()
    }
  }

  const handleSubmit = (event: IChangeEvent) => {
    log("submitted")
    log(event.formData)
  }

  const onError = (errors: any) => {
    log("errors")
    log(errors)
  }


  return (
    <Box p={2}>
      <Form
        schema={schema}
        uiSchema={uiSchema}
        formData={dataRef.current || data}
        validator={validator}
        onChange={(e) => debounce(e.formData)}
        onSubmit={handleSubmit}
        onError={onError}
      >
        <button ref={submitFormRef} type="submit" style={{ display: "none" }} />
      </Form>
    </Box>
  )
}
