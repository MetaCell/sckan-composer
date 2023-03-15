import React, { useEffect, useState } from "react";
import { FormBase } from './FormBase'
import { jsonSchemas } from '../../services/JsonSchema'
import doiService from '../../services/DoisService'
import connectivityStatementService from "../../services/StatementService";
import {ChipsInput} from "../Widgets/ChipsInput";
import {Doi} from "../../apiclient/backend";
import Box from "@mui/material/Box";
import { setTextRange } from 'typescript';


const DoisForm = (props: any) => {
  const { extraData } = props

  const [chipsData, setChipsData] = useState([])
  const [refetch, setRefetch] = useState(true)

  const { schema, uiSchema } = jsonSchemas.getDoiSchema()
  const copiedSchema = JSON.parse(JSON.stringify(schema));
  const copiedUISchema = JSON.parse(JSON.stringify(uiSchema));

  useEffect(() => {
    if(refetch) {
      connectivityStatementService.getObject(extraData.connectivity_statement_id).then((response: any) => {
        setChipsData(response.dois)
        setRefetch(false)
      })
    }
  }, [extraData, refetch])

  // TODO: set up the widgets for the schema
  copiedSchema.title = ""

  copiedUISchema.doi = {
    "ui:widget": ChipsInput,
    "ui:options": {
      data: chipsData?.map((row: Doi) => ({id: row.id, label: row.doi})),
      placeholder: 'Enter DOIs (Press Enter to add a DOI)',
      removeChip: function(doiId: any) {
        doiService.delete(doiId, extraData.connectivity_statement_id)
        setChipsData(chipsData.filter((row: Doi) => row.id !== doiId))
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
        schema={copiedSchema}
        uiSchema={copiedUISchema}
        enableAutoSave={false}
        clearOnSave={true}
        children={true}
        extraData={extraData}
        setter={() => setRefetch(true)}
      />
    </Box>
  )
}

export default DoisForm
