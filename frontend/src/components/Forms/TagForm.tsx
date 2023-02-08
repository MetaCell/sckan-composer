import React from 'react'
import { Box } from '@mui/material'
import { FormBase } from './FormBase'
import { jsonSchemas } from '../../services/JsonSchema'
import tagService from '../../services/TagService'
import Typography from '@mui/material/Typography'


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

  return (
    <Box p={2}>
      {
        data.map((tag: any) => 
          <Typography key={tag.tag} variant='subtitle2' onClick={() => delTag(tag.id)}>[x] {tag.tag}</Typography>
      )}
      <FormBase
        data={{}}
        service={tagService}
        schema={schema}
        uiSchema={uiSchema}
        uiFields={uiFields}
        enableAutoSave={false}
        clearOnSave={true}
        {...props}
      />
    </Box>
  )
}

export default TagForm