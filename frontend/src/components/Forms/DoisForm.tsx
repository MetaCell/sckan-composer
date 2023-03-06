import React from 'react'
import { Box } from '@mui/material'
import { FormBase } from './FormBase'
import { jsonSchemas } from '../../services/JsonSchema'
import doiService from '../../services/DoisService'
import {UiSchema} from "@rjsf/utils";
import {ChipsInput} from "../Widgets/ChipsInput";
import {Doi, Tag} from "../../apiclient/backend";


const DoisForm = (props: any) => {
  const { data, extraData, setter } = props

  const { schema, uiSchema } = jsonSchemas.getDoiSchema()

  // TODO: set up the widgets for the schema
  const uiFields = ["doi",]

  const customSchema = {
    ...schema,
    "title": ""
  }

  const customUiSchema: UiSchema = {
    ...uiSchema,
    doi: {
      "ui:widget": ChipsInput,
      "ui:options": {
        data: data.map((row: Doi) => ({id: row.id, label: row.doi})),
        placeholder: 'Enter DOIs (Press Enter to add a DOI)'
      }
    },
  };

  return (
    <FormBase
      data={{}}
      service={doiService}
      schema={customSchema}
      uiSchema={customUiSchema}
      uiFields={uiFields}
      enableAutoSave={false}
      clearOnSave={true}
      {...props}
    />
  )
}

export default DoisForm
