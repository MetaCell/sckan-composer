import React, { useEffect, useState } from "react";
import { FormBase } from "./FormBase";
import { jsonSchemas } from "../../services/JsonSchema";
import statementService from "../../services/StatementService";
import CustomTextField from "../Widgets/CustomTextField";
import CustomSingleSelect from "../Widgets/CustomSingleSelect";
import CustomTextArea from "../Widgets/CustomTextArea";
import { biologicalSexes } from "../../services/BiologicalSexService";
import { ansDivisions } from "../../services/AnsDivisionService";
import ArrayFieldTemplate from "../Widgets/ArrayFieldTemplate";
import AnatomicalEntitiesField from "../AnatomicalEntitiesField";

const StatementForm = (props: any) => {
  const { uiFields, statement, setter, format } = props;
  const { schema, uiSchema } = jsonSchemas.getConnectivityStatementSchema();
  const copiedSchema = JSON.parse(JSON.stringify(schema));
  const copiedUISchema = JSON.parse(JSON.stringify(uiSchema));

  // TODO: set up the widgets for the schema
  copiedSchema.title = "";
  copiedSchema.properties.path.title = "";
  copiedUISchema["ui:order"] = ["destination_type", "*"];
  copiedUISchema.circuit_type = {
    "ui:widget": "radio",
    "ui:options": {
      classNames: "col-xs-12 col-md-6",
    },
  };

  copiedUISchema.laterality = {
    "ui:widget": "radio",
    "ui:options": {
      classNames: "col-xs-12 col-md-6",
    },
  };

  copiedUISchema.apinatomy_model = {
    "ui:widget": "CustomTextField",
    "ui:options": {
      label: "Apinatomy Model Name",
      placeholder: "Enter Apinatomay Model Name",
    },
    value: statement?.apinatomy_model ?? "",
  };

  copiedUISchema.biological_sex_id = {
    "ui:widget": "CustomSingleSelect",
    "ui:options": {
      label: "Biological Sex",
      placeholder: "Enter Biological Sex",
      data: biologicalSexes
        .getBiologicalSexes()
        .map((row: any) => ({ label: row.name, value: row.id })),
    },
    value: statement?.biological_sex_id ?? "",
  };

  copiedUISchema.ans_division_id = {
    "ui:widget": "CustomSingleSelect",
    "ui:options": {
      label: "ANS Division",
      placeholder: "Select ANS Division",
      data: ansDivisions
        .getAnsDivisions()
        .map((row: any) => ({ label: row.name, value: row.id })),
    },
    value: statement?.ans_division_id ?? "",
  };

  copiedUISchema.knowledge_statement = {
    "ui:widget": "CustomTextArea",
    "ui:options": {
      label: "Knowledge Statement",
      placeholder: "Knowledge Statement",
      rows: 4,
      hasDebouncedOnChange: true,
      value: statement?.knowledge_statement ?? "",
    },
  };

  copiedUISchema.destination_id = {
    "ui:widget": AnatomicalEntitiesField,
    "ui:options": {
      label: format === "noLabel" ? false : "Destination",
    },
  };

  copiedUISchema.origin_id = {
    "ui:widget": AnatomicalEntitiesField,
    "ui:options": {
      label: format === "noLabel" ? false : "Origin",
    },
    default: statement.origin,
  };

  copiedUISchema.destination_type = {
    "ui:options": {
      label: false,
      placeholder: 'Select detination type'
    },
  };

  copiedUISchema.path.items = {
    "ui:options": {
      label: false,
    },
    "ui:label": false
  };

  copiedUISchema.path.items.anatomical_entity_id = {
    "ui:widget": AnatomicalEntitiesField,
    "ui:options": {
      label: false,
    },
  };

  copiedUISchema.path.items.display_order = {
    "ui:widget": "hidden",
  };

  const widgets = {
    AnatomicalEntitiesField,
    CustomSingleSelect,
    CustomTextField,
    CustomTextArea,
    SelectWidget: CustomSingleSelect,
  };

  const templates = {
    ArrayFieldTemplate,
  };

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
      templates={templates}
      showErrorList={false}
    />
  );
};

export default StatementForm;
