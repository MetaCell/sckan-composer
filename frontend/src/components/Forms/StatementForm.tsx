import React, {useEffect, useState} from 'react'
import { FormBase } from './FormBase'
import { jsonSchemas } from '../../services/JsonSchema'
import statementService from '../../services/StatementService'
import CustomTextField from "../Widgets/CustomTextField";
import CustomSingleSelect from "../Widgets/CustomSingleSelect";
import CustomTextArea from "../Widgets/CustomTextArea";
import { biologicalSexes } from '../../services/BiologicalSexService';
import { ansDivisions } from '../../services/AnsDivisionService';
import AutoComplete from "../AutoComplete";
import {AnatomicalEntity} from "../../apiclient/backend";
import {composerApi as api} from "../../services/apis";
import {duplicatesSelectRowsPerPage} from "../../helpers/settings";

const StatementForm = (props: any) => {
  const {  uiFields, statement, setter} = props
  const { schema, uiSchema } = jsonSchemas.getConnectivityStatementSchema()
  const copiedSchema = JSON.parse(JSON.stringify(schema));
  const copiedUISchema = JSON.parse(JSON.stringify(uiSchema));
  const [origin, setOrigin] = React.useState<AnatomicalEntity | undefined>(statement.origin || undefined);
  const [destination, setDestination] = React.useState<AnatomicalEntity | undefined>(statement.destination || undefined);
  // TODO: set up the widgets for the schema
  copiedSchema.title = ""
  copiedUISchema.circuit_type =  {
    "ui:widget": "radio",
    "ui:options": {
      classNames: 'col-xs-12 col-md-6'
    }
  }

  copiedUISchema.destination_type =  {
    "ui:widget": "radio",
    "ui:options": {
      classNames: 'col-xs-12 col-md-6'
    }
  }

  copiedUISchema.laterality= {
    "ui:widget": "radio",
      "ui:options": {
      classNames: 'col-xs-12 col-md-6'
    }
  }

  copiedUISchema.apinatomy_model= {
    "ui:widget": "CustomTextField",
      "ui:options": {
      label: 'Apinatomy Model Name',
      placeholder: "Enter Apinatomay Model Name",
    },
    value: statement?.apinatomy_model ?? ""
  }

  copiedUISchema.biological_sex_id = {
    "ui:widget": "CustomSingleSelect",
      "ui:options": {
      label: 'Biological Sex',
        placeholder: "Enter Biological Sex",
        data: biologicalSexes.getBiologicalSexes().map((row: any) => ({id: row.id, label: row.name})),
    },
    value: statement?.biological_sex_id ?? ""
  }

  copiedUISchema.ans_division_id = {
    "ui:widget": "CustomSingleSelect",
      "ui:options": {
      label: 'ANS Division',
        placeholder: "Select ANS Division",
        data: ansDivisions.getAnsDivisions().map((row: any) => ({id: row.id, label: row.name})),
    },
    value: statement?.ans_division_id ?? ""
  }

  copiedUISchema.knowledge_statement = {
    "ui:widget": "CustomTextArea",
      "ui:options": {
      label: 'Knowledge Statement',
        placeholder: "Knowledge Statement",
        rows: 4,
        hasDebouncedOnChange:true,
        value: statement?.knowledge_statement ?? ""
    },
  }
  const autoCompleteFetch = (inputValue: string) => api.composerAnatomicalEntityList(duplicatesSelectRowsPerPage, inputValue, 0)
  const autoCompleteNoOptionsText = "No entities found"

  copiedUISchema.destination_id = {
    "ui:widget": (props: any) => {
      return (
        <AutoComplete
          disabled={props.disabled}
          onChange={(event: any) => props.onChange(event.id)}
          placeholder="Select destination"
          noOptionsText={autoCompleteNoOptionsText}
          setValue={(value: AnatomicalEntity) => {
            setter({...statement, destination: value, destination_id: value.id})
            setDestination(value)
          }}
          fetch={autoCompleteFetch}
          value={destination}
          label='Destination'
        />
      );
    },
  }

  copiedUISchema.origin_id = {
    "ui:widget": (props: any) => {
      return (
        <AutoComplete
          disabled={props.disabled}
          onChange={(event: any) => props.onChange(event.id)}
          placeholder="Select origin"
          noOptionsText={autoCompleteNoOptionsText}
          setValue={(value: AnatomicalEntity) => {
            setter({...statement, origin: value, origin_id: value.id})
            setOrigin(value)
          }}
          fetch={autoCompleteFetch}
          value={origin}
          label='Origin'
        />
      );
    },
    default: statement.origin
  }

  const widgets = {
    CustomSingleSelect,
    CustomTextField,
    CustomTextArea
  }

  return (
    <FormBase
      {...props}

      data={statement}
      service={statementService}
      schema={copiedSchema}
      uiSchema={copiedUISchema}
      uiFields={uiFields}
      enableAutoSave={true}
      children={true}
      widgets={widgets}
    />
  )
}

export default StatementForm
