import React from 'react'
import { FormBase } from './FormBase'
import { jsonSchemas } from '../../services/JsonSchema'
import specieService, { species } from "../../services/SpecieService";
import {UiSchema} from "@rjsf/utils";
import { Specie } from '../../apiclient/backend';
import { AutocompleteWithChips } from '../Widgets/AutocompleteWithChips';


const SpeciesForm = (props: any) => {
  const { data, extraData, setter, disabled } = props

  const { schema, uiSchema } = jsonSchemas.getSpeciesSchema()

  const availableOptions = species.getSpecieList().filter((s:Specie)=> !data.some(({id}:any)=> id === s.id))

  const delSpecie = (specieId:number) =>{
    extraData.service.removeSpecie(extraData.parentId, specieId).then((newData: any) => {
      setter(newData)
    })
  }

  const handleAutocompleteChange = (e:any, value:any)=>{
    const selectedSpecie = value.pop()
    extraData.service.addSpecie(extraData.parentId,selectedSpecie.id).then((newData:any)=>{
      setter()
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
      "ui:widget": AutocompleteWithChips,
      "ui:options": {
        disabled,
        data: data?.map((row: Specie)=>({id:row.id, label: row.name})),
        label: 'Species',
        placeholder: 'Select Species',
        options: availableOptions.map((row: Specie)=>({id:row.id, label: row.name})),
        removeChip: delSpecie,
        onAutocompleteChange: handleAutocompleteChange
      },
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
      disabled={disabled}
      {...props}
    />
  )
}

export default SpeciesForm
