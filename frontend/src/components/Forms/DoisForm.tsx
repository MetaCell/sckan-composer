import React from "react";
import { FormBase } from './FormBase'
import { jsonSchemas } from '../../services/JsonSchema'
import doiService from '../../services/DoisService'
import {ChipsInput} from "../Widgets/ChipsInput";
import {Doi} from "../../apiclient/backend";
import Box from "@mui/material/Box";
import { setTextRange } from 'typescript';


const DoisForm = (props: any) => {
  const { doisData, setter, extraData } = props

  const { schema, uiSchema } = jsonSchemas.getDoiSchema()
  const copiedSchema = JSON.parse(JSON.stringify(schema));
  const copiedUISchema = JSON.parse(JSON.stringify(uiSchema));

  const refresh = () => {
    setter()
  }

  // TODO: set up the widgets for the schema
  copiedSchema.title = ""

  copiedUISchema.doi = {
    "ui:widget": ChipsInput,
    "ui:options": {
      disabled: !extraData.connectivity_statement_id,
      data: doisData?.map((row: Doi) => ({id: row.id, label: row.doi})),
      placeholder: 'Enter DOIs (Press Enter to add a DOI)',
      removeChip: function(doiId: any) {
        doiService.delete(doiId, extraData.connectivity_statement_id)
        refresh()
      },
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
        data={doisData}
        schema={copiedSchema}
        uiSchema={copiedUISchema}
        enableAutoSave={false}
        clearOnSave={true}
        children={true}
        extraData={extraData}
        setter={() => refresh()}
        {...props}
      />
    </Box>
  )
}

export default DoisForm
