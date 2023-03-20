import React from 'react'
import { Box } from '@mui/material'
import { FormBase } from './FormBase'
import { jsonSchemas } from '../../services/JsonSchema'
import tagService, { tags } from '../../services/TagService'
import {UiSchema} from "@rjsf/utils";
import {ChipsInput} from "../Widgets/ChipsInput";
import {Tag} from "../../apiclient/backend";
import { AutocompleteWithChips } from '../Widgets/AutocompleteWithChips';


const TagForm = (props: any) => {
  const { data, extraData, setter } = props

  const { schema, uiSchema } = jsonSchemas.getSpeciesSchema()

  const availableOptions = tags.getTagList().filter((t:Tag)=> !data.some(({id}:any)=> id === t.id))

  const delTag = (tagId:number) =>{
    extraData.service.removeTag(extraData.parentId, tagId).then((newData: any) => {
      setter(newData)
    })
  }

  const handleAutocompleteChange = (e:any, value:any)=>{
    const selectedTag = value.pop()
    extraData.service.addTag(extraData.parentId,selectedTag.id).then((newData:any)=>{
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
        data: data?.map((row: Tag)=>({id:row.id, label: row.tag})),
        label: 'Tags',
        placeholder: 'Select Tags',
        options: availableOptions.map((row: Tag)=>({id:row.id, label: row.tag})),
        removeChip: delTag,
        onAutocompleteChange: handleAutocompleteChange
      },
    },
  };


  return (
    <FormBase
      data={{}}
      service={tagService}
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

export default TagForm
