import React from 'react'
import { FormBase } from './FormBase'
import { jsonSchemas } from '../../services/JsonSchema'
import doiService from '../../services/DoisService'
import {UiSchema} from "@rjsf/utils";
import {ChipsInput} from "../Widgets/ChipsInput";
import {Doi, Tag} from "../../apiclient/backend";
import Box from "@mui/material/Box";


const DoisForm = (props: any) => {
  const { doisData: doiData } = props

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
        data: doiData?.map((row: Doi) => ({id: row.id, label: row.doi})),
        placeholder: 'Enter DOIs (Press Enter to add a DOI)',
      }
    },
  };

  const data = {
    id: 1,
    doi: doiData
  }

  return (
    <Box sx={{
      padding: 0,
      "& .MuiBox-root": {
        padding: 0,

        "& .MuiInputBase-root": {
          border: 0,
          boxShadow: 'none'
        }
      }
    }}>
      <FormBase
        service={doiService}
        schema={customSchema}
        uiSchema={customUiSchema}
        uiFields={uiFields}
        enableAutoSave={false}
        clearOnSave={true}
        children={true}
      />
    </Box>
  )
}

export default DoisForm
