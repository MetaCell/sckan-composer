import React from "react";
import { FormBase } from './FormBase'
import { jsonSchemas } from '../../services/JsonSchema'
import provenanceService from '../../services/ProvenanceService'
import {ChipsInput} from "../Widgets/ChipsInput";
import {Provenance} from "../../apiclient/backend";
import Box from "@mui/material/Box";
import { setTextRange } from 'typescript';


const ProvenancesForm = (props: any) => {
  const { provenancesData, setter, extraData } = props

  const { schema, uiSchema } = jsonSchemas.getProvenanceSchema()
  const copiedSchema = JSON.parse(JSON.stringify(schema));
  const copiedUISchema = JSON.parse(JSON.stringify(uiSchema));

  const refresh = () => {
    setter()
  }

  // TODO: set up the widgets for the schema
  copiedSchema.title = ""

  const data = provenancesData?.map((row: Provenance) => ({id: row.id, label: row.uri}))

  copiedUISchema.uri = {
    "ui:widget": ChipsInput,
    "ui:options": {
      disabled: !extraData.connectivity_statement_id,
      data: provenancesData?.map((row: Provenance) => ({id: row.id, label: row.uri})),
      placeholder: 'Enter Provenances (Press Enter to add a Provenance)',
      removeChip: function(provenanceId: any) {
        provenanceService.delete(provenanceId, extraData.connectivity_statement_id)
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
      marginBottom: 2,
      "& .MuiBox-root": {
        padding: 0,
      }
    }}>
      <FormBase
        service={provenanceService}
        data={provenancesData}
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

export default ProvenancesForm
