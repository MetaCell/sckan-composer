import React, {useEffect} from 'react'
import { FormBase } from './FormBase'
import { jsonSchemas } from '../../services/JsonSchema'
import statementService from '../../services/StatementService'
import {UiSchema} from "@rjsf/utils";
import CustomTextArea from '../Widgets/CustomTextArea'
import CustomTextField from "../Widgets/CustomTextField";
import Paper from "@mui/material/Paper";
import AutoComplete from "../AutoComplete";

const SentenceForm = (props: any) => {
  const { format } = props
  const { schema, uiSchema } = jsonSchemas.getConnectivityStatementSchema()

  const uiFields = format === 'small'
    ? ["knowledge_statement","dois","species","biological_sex_id", "apinatomy_model", "circuit_type", "laterality", "ans_division_id"]
    : undefined
  // TODO: set up the widgets for the schema

  const customUiSchema: UiSchema = {
    ...uiSchema,
    circuit_type: {
      "ui:widget": "radio",
      "ui:options": {
        classNames: 'col-xs-12 col-md-6'
      }
    }   ,
    laterality: {
      "ui:widget": "radio",
      "ui:options": {
        classNames: 'col-xs-12 col-md-6'
        }
      },
    knowledge_statement: {
      "ui:widget": CustomTextArea,
      "ui:options": {
        placeholder: "Enter Knowledge statement",
        rows: 5,
      }
    },
    dois: {
      "ui:title": "",
      "ui:options": {
        classNames: "costume-dois",
      }
    },
    apinatomy_model: {
      "ui:widget": CustomTextField,
      "ui:options": {
        label: 'Apinatomy Model Name',
        placeholder: "Enter Apinatomay Model Name",
      }
    },
    biological_sex_id: {
      "ui:widget": CustomTextField,
      "ui:options": {
        label: 'Biological Sex',
        placeholder: "Enter Biological Sex",
      }
    },
    // ans_division_id: {
    //   "ui:widget": AutoComplete,
    //   "ui:options": {
    //     label: 'ANS Division',
    //     placeholder: "Select ANS Division",
    //   }
    // },
  };

  const customSchema = {
    ...schema,
    "title": ""
  }

  return (
    <Paper sx={{background: '#F2F4F7'}}>
      <FormBase
        service={statementService}
        schema={customSchema}
        uiSchema={customUiSchema}
        uiFields={uiFields}
        enableAutoSave={true}
        {...props}
      />
    </Paper>

  )
}

export default SentenceForm
