import React from 'react'
import { Box } from '@mui/material'
import { FormBase } from './FormBase'
import { jsonSchemas } from '../../services/JsonSchema'
import statementService from '../../services/StatementService'

const StatementForm = (props: any) => {
  const { format } = props
  const { schema, uiSchema } = jsonSchemas.getConnectivityStatementSchema()

  const uiFields = format === 'small'
    ? ["knowledge_statement",]
    : undefined

  // TODO: set up the widgets for the schema

  return (
    <Box p={2}>
      <FormBase
        service={statementService}
        schema={schema}
        uiSchema={uiSchema}
        uiFields={uiFields}
        {...props}
      />
    </Box>
  )
}

export default StatementForm