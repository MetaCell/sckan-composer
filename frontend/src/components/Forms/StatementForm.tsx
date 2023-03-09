import React, {useEffect} from 'react'
import { FormBase } from './FormBase'
import { jsonSchemas } from '../../services/JsonSchema'
import statementService from '../../services/StatementService'
import {UiSchema} from "@rjsf/utils";
import CustomTextField from "../Widgets/CustomTextField";
import CustomMultipleSelectChip from "../Widgets/CustomMultipleSelectChip";

const StatementForm = (props: any) => {
  const { format, extraData } = props
  const { schema, uiSchema } = jsonSchemas.getConnectivityStatementSchema()

  const uiFields = format === 'small'
    ? ["biological_sex_id", "apinatomy_model", "circuit_type", "laterality", "ans_division_id"]
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
    apinatomy_model: {
      "ui:widget": CustomTextField,
      "ui:options": {
        label: 'Apinatomy Model Name',
        placeholder: "Enter Apinatomay Model Name",
      }
    },
    biological_sex_id: {
      "ui:widget": CustomMultipleSelectChip,
      "ui:options": {
        label: 'Biological Sex',
        placeholder: "Enter Biological Sex",
      }
    },
    ans_division_id: {
      "ui:widget": CustomMultipleSelectChip,
      "ui:options": {
        label: 'ANS Division',
        placeholder: "Select ANS Division",
      }
    },
  };


  const customSchema = {
    ...schema,
    title: "",
    ui: {
      "ui:options": {
        submit: false
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
      extraData={extraData}
      {...props}
    />
  )
}

export default StatementForm
