import React from 'react'
import { Box } from '@mui/material'
import { FormBase } from './FormBase'
import { jsonSchemas } from '../../services/JsonSchema'
import tagService from '../../services/TagService'
import {UiSchema} from "@rjsf/utils";
import {ChipsInput} from "../Widgets/ChipsInput";
import {Tag} from "../../apiclient/backend";


const TagForm = (props: any) => {
  const { data, extraData, setter } = props
  const { schema, uiSchema } = jsonSchemas.getTagSchema()

  const delTag = (tagId: number) => {
    extraData.service.removeTag(extraData.parentId, tagId).then((newData: any) => {
      setter(newData)
    })
  }

  // TODO: set up the widgets for the schema
  const uiFields = ["tag",]


  const customSchema = {
    ...schema,
    "title": ""
  }

  const customUiSchema: UiSchema = {
    ...uiSchema,
    tag: {
      "ui:widget": ChipsInput,
      "ui:options": {
        data: data.map((row: Tag) => ({id: row.id, label: row.tag})),
        placeholder: 'Add a Tag',
        removeChip: delTag,
      }
    },
  };

  return (
    <Box p={2}>
      <FormBase
        data={{}}
        service={tagService}
        schema={customSchema}
        uiSchema={customUiSchema}
        uiFields={uiFields}
        enableAutoSave={false}
        clearOnSave={true}
        {...props}
      />
    </Box>
  )
}

export default TagForm
