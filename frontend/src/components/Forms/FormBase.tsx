import React, { useState } from 'react'
import validator from "@rjsf/validator-ajv8";
import { IChangeEvent, withTheme } from "@rjsf/core";
import { Box } from '@mui/material';
import { Theme } from '@rjsf/mui'

const Form = withTheme(Theme)

const log = (type: string) => console.log.bind(console, type)

export const FormBase = (props: any) => {
  const { service, data, schema, setter, uiSchema, uiFields } = props

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

  const handleSubmit = (event: IChangeEvent) => {
    log("submitted")
    service.save(event.formData).then((newData:any) => {
      setter(newData)
    })
  }


 const handleUpdate = (event: IChangeEvent) => {
    log("update")
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
        formData={data}
        validator={validator}
        onSubmit={handleSubmit}
        onError={onError}
        onChange={handleUpdate}
      />
    </Box>
  )
}
