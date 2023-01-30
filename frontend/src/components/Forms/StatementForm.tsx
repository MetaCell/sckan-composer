import React from 'react'
import { Box } from '@mui/material'
import { FormBase } from './FormBase'
import { jsonSchemas } from '../../services/JsonSchema'

const StatementForm = (props: any) => {
  const { data, format } = props
  const { schema, uiSchema } = jsonSchemas.getConnectivityStatementSchema()

  if (!data) {
    return (<div>Loading...</div>)
  }

  const uiFields = format === 'small'
    ? ["knowledge_statement",]
    : undefined

  // TODO: set up the widgets for the schema

  return (
    <Box p={2}>
      <FormBase
        data={data}
        schema={schema}
        uiSchema={uiSchema}
        uiFields={uiFields}
      />
    </Box>
  )
}

export default StatementForm