import React from 'react'
import { Box } from '@mui/material'
import { FormBase } from './FormBase'
import { jsonSchemas } from '../../services/JsonSchema'
import specieService from "../../services/SpecieService";
import {UiSchema} from "@rjsf/utils";
import {ChipsInput} from "../Widgets/ChipsInput";
import { Specie } from '../../apiclient/backend';


const SpeciesForm = (props: any) => {
  const { data, extraData, setter } = props

  const { schema, uiSchema } = jsonSchemas.getSpeciesSchema()

  const delSpecie = (specieId:number) =>{
    extraData.service.removeSpecie(extraData.parentId, specieId).then((newData: any) => {
      setter(newData)
    })
  }

  // TODO: set up the widgets for the schema
  const uiFields = ["name",]

  const customSchema = {
    ...schema,
    "title": ""
  }

  const customUiSchema: UiSchema = {
    ...uiSchema,
    name: {
      "ui:widget": ChipsInput,
      "ui:options": {
        data: data.map((row: Specie)=>({id:row.id, label: row.name})),
        label: 'Species',
        placeholder: 'Select Species',
        removeChip: delSpecie,
      }
    },
  };

  return (
    <FormBase
      data={{}}
      service={specieService}
      schema={customSchema}
      uiSchema={customUiSchema}
      uiFields={uiFields}
      enableAutoSave={false}
      clearOnSave={true}
      children={true}
      {...props}
    />
  )
}

export default SpeciesForm
