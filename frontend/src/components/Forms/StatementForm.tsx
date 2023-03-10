import React, {useEffect, useState} from 'react'
import { FormBase } from './FormBase'
import { jsonSchemas } from '../../services/JsonSchema'
import statementService from '../../services/StatementService'
import CustomTextField from "../Widgets/CustomTextField";
import CustomSingleSelect from "../Widgets/CustomSingleSelect";
import CustomTextArea from "../Widgets/CustomTextArea";

const StatementForm = (props: any) => {
  const [divisionList,setDivisionList] = useState([])
  const [biologicalSex,setBiologicalSexList] = useState([])
  const { data, extraData, uiFields, statement } = props
  const { schema, uiSchema } = jsonSchemas.getConnectivityStatementSchema()
  const copiedSchema = JSON.parse(JSON.stringify(schema));
  const copiedUISchema = JSON.parse(JSON.stringify(uiSchema));
  // TODO: set up the widgets for the schema
  copiedSchema.title = ""
  copiedUISchema.circuit_type =  {
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
        data: biologicalSex?.map((row: any) => ({id: row.id, label: row.name})),
    },
    value: statement?.biological_sex_id ?? ""
  }

  copiedUISchema.ans_division_id = {
    "ui:widget": "CustomSingleSelect",
      "ui:options": {
      label: 'ANS Division',
        placeholder: "Select ANS Division",
        data: divisionList?.map((row: any) => ({id: row.id, label: row.name})),
    },
    value: statement?.ans_division_id ?? ""
  }

  const widgets = {
    CustomSingleSelect,
    CustomTextField
  }

  useEffect(() => {
    statementService.getANSDivisionList().then((result) => {
      setDivisionList(result.results)
    })
    statementService.getBiologicalSexList().then((result) => {
      setBiologicalSexList(result.results)
    })
  }, [])

  data['sentence_id'] = extraData.sentence_id
  data['knowledge_statement'] = extraData.knowledge_statement

  return (
    <FormBase
      data={statement}
      service={statementService}
      schema={copiedSchema}
      uiSchema={copiedUISchema}
      uiFields={uiFields}
      enableAutoSave={true}
      children={true}
      widgets={widgets}
      isUpdate={!!statement?.id}
    />
  )
}

export default StatementForm
