import React from 'react'
import { Box } from '@mui/material'
import { FormBase } from './FormBase'
import { jsonSchemas } from '../../services/JsonSchema'
import noteService from '../../services/NoteService'
import Button from "@mui/material/Button";
import {UiSchema} from "@rjsf/utils";
import CustomTextArea from "../Widgets/CustomTextArea";
import SendIcon from '@mui/icons-material/Send';
import {vars} from "../../theme/variables";
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import MessageIcon from '@mui/icons-material/Message';
import Typography from "@mui/material/Typography";
import statementService from "../../services/StatementService";

const KnowledgeStatementsForm = (props: any) => {
  const { schema, uiSchema } = jsonSchemas.getConnectivityStatementSchema()

  // TODO: set up the widgets for the schema
  const uiFields = ["knowledge_statement"]
  const customSchema = {
    ...schema,
    "title": ""
  }

  const customUiSchema: UiSchema = {
    ...uiSchema,
    "knowledge_statement": {
      "ui:widget": CustomTextArea,
      "ui:options": {
        placeholder: "Enter Knowledge statement",
        rows: 5,
      }
    },
  };


  return (
    <FormBase
      service={statementService}
      schema={customSchema}
      uiSchema={customUiSchema}
      uiFields={uiFields}
      enableAutoSave={true}
      children={true}
      {...props}
    />
  )
}

export default KnowledgeStatementsForm
