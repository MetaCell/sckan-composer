import React, { useEffect, useState } from "react";
import { FormBase } from "./FormBase";
import { jsonSchemas } from "../../services/JsonSchema";
import statementService from "../../services/StatementService";
import CustomTextField from "../Widgets/CustomTextField";
import CustomSingleSelect from "../Widgets/CustomSingleSelect";
import CustomTextArea from "../Widgets/CustomTextArea";
import ArrayFieldTemplate from "../Widgets/ArrayFieldTemplate";
import AnatomicalEntitiesField from "../AnatomicalEntitiesField";
import { sexes } from '../../services/SexService';
import { phenotypes } from '../../services/PhenotypeService';

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

  copiedUISchema.projection= {
    "ui:widget": "radio",
      "ui:options": {
      classNames: 'col-xs-12 col-md-6'
    }
  }

  copiedUISchema.apinatomy_model= {
    "ui:widget": "CustomTextField",
    "ui:options": {
      label: "Apinatomy Model Name",
      placeholder: "Enter Apinatomay Model Name",
    },
    value: statement?.apinatomy_model ?? "",
  };

  copiedUISchema.sex_id = {
    "ui:widget": "CustomSingleSelect",
      "ui:options": {
      label: 'Sex',
        placeholder: "Enter Sex",
        data: sexes.getSexes().map((row: any) => ({ label: row.name, value: row.id })),
    },
    value: statement?.sex_id ?? ""
  }

  copiedUISchema.phenotype_id = {
    "ui:widget": "CustomSingleSelect",
      "ui:options": {
      label: 'Phenotype',
        placeholder: "Select Phenotype",
        data: phenotypes.getPhenotypes().map((row: any) => ({ label: row.name, value: row.id })),
    },
    value: statement?.phenotype_id ?? ""
  }

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
