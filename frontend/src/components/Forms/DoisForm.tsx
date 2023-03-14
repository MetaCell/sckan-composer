import React from 'react'
import { FormBase } from './FormBase'
import { jsonSchemas } from '../../services/JsonSchema'
import doiService from '../../services/DoisService'
import {ChipsInput} from "../Widgets/ChipsInput";
import {Doi} from "../../apiclient/backend";
import Box from "@mui/material/Box";


const DoisForm = (props: any) => {
  const { doisData: doiData, extraData } = props

  const { schema, uiSchema } = jsonSchemas.getDoiSchema()
  const copiedSchema = JSON.parse(JSON.stringify(schema));
  const copiedUISchema = JSON.parse(JSON.stringify(uiSchema));

  // TODO: set up the widgets for the schema
  copiedSchema.title = ""

  copiedUISchema.doi = {
    "ui:widget": ChipsInput,
    "ui:options": {
      data: doiData?.map((row: Doi) => ({id: row.id, label: row.doi})),
      placeholder: 'Enter DOIs (Press Enter to add a DOI)',
    }
  }
  copiedUISchema.connectivity_statement_id = {
    "ui:widget": 'hidden',
  }

  copiedSchema.properties.connectivity_statement_id = {
    ...copiedSchema.properties.connectivity_statement_id,
    default: extraData.connectivity_statement_id
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
        schema={copiedSchema}
        uiSchema={copiedUISchema}
        enableAutoSave={false}
        clearOnSave={true}
        children={true}
        extraData={extraData}
      />
    </Box>
  )
}

export default DoisForm
