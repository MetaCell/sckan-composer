import React, { useEffect, useState } from "react";
import { FormBase } from "./FormBase";
import { jsonSchemas } from "../../services/JsonSchema";
import statementService from "../../services/StatementService";
import CustomTextField from "../Widgets/CustomTextField";
import CustomSingleSelect from "../Widgets/CustomSingleSelect";
import CustomTextArea from "../Widgets/CustomTextArea";
import ArrayFieldTemplate from "../Widgets/ArrayFieldTemplate";
import AnatomicalEntitiesField from "../AnatomicalEntitiesField";
import { sexes } from "../../services/SexService";
import { phenotypes } from "../../services/PhenotypeService";
import { CustomAutocompleteForwardConnection } from "../Widgets/CustomAutocompleteForwardConnection";
import { CustomAnatomicalField } from "../Widgets/CustomAnatomicalField";

const StatementForm = (props: any) => {
  const { uiFields, statement, setter, format } = props;
  const { schema, uiSchema } = jsonSchemas.getConnectivityStatementSchema();
  const copiedSchema = JSON.parse(JSON.stringify(schema));
  const copiedUISchema = JSON.parse(JSON.stringify(uiSchema));
  // TODO: set up the widgets for the schema
  copiedSchema.title = "";
  copiedSchema.properties.path.title = "";
  copiedSchema.properties.forward_connection.type = ["string", "null"];
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

  copiedUISchema.projection = {
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

  copiedUISchema.sex_id = {
    "ui:widget": "CustomSingleSelect",
    "ui:options": {
      label: "Sex",
      placeholder: "Enter Sex",
      data: sexes
        .getSexes()
        .map((row: any) => ({ label: row.name, value: row.id })),
    },
    value: statement?.sex_id ?? "",
  };

  copiedUISchema.phenotype_id = {
    "ui:widget": "CustomSingleSelect",
    "ui:options": {
      label: "Phenotype",
      placeholder: "Select Phenotype",
      data: phenotypes
        .getPhenotypes()
        .map((row: any) => ({ label: row.name, value: row.id })),
    },
    value: statement?.phenotype_id ?? "",
  };

  copiedUISchema.knowledge_statement = {
    "ui:widget": "CustomTextArea",
    "ui:options": {
      label: "Knowledge Statement",
      placeholder: "Enter Knowledge Statement",
      rows: 4,
      value: statement?.knowledge_statement ?? "",
    },
  };

  copiedUISchema.destination_id = {
    "ui:widget": AnatomicalEntitiesField,
    "ui:options": {
      label: format === "noLabel" ? false : "Destination",
      errors: statement?.errors?.includes("Invalid forward connection")
        ? statement.errors
        : "",
    },
  };

  const mockEntities = [
        {
          "id": "5304",
          "relation": 'Origins',
          "('Aortic arch', 'arch of aorta')": [
            {
              "title": "Name",
              "value": "('Aortic arch', 'arch of aorta')"
            },
            {
              "title": "Ontology URI",
              "value": "http://purl.obolibrary.org/obo/UBERON_0001508"
            }
          ]
        },
        {
          "id": "32845",
          "relation": 'Origins',
          "(embryonic) hindbrain flexure": [
            {
              "title": "Name",
              "value": "(embryonic) hindbrain flexure"
            },
            {
              "title": "Ontology URI",
              "value": "http://purl.obolibrary.org/obo/UBERON_0005820"
            }
          ]
        },
        {
          "id": "47428",
          "relation": 'Origins',
          "(mid-third) lateral capsular ligament": [
            {
              "title": "Name",
              "value": "(mid-third) lateral capsular ligament"
            },
            {
              "title": "Ontology URI",
              "value": "http://purl.obolibrary.org/obo/UBERON_0014899"
            }
          ]
        },
        {
          "id": "12822",
          "relation": 'Origins',
          "(pre-)piriform cortex": [
            {
              "title": "Name",
              "value": "(pre-)piriform cortex"
            },
            {
              "title": "Ontology URI",
              "value": "http://purl.obolibrary.org/obo/UBERON_0002590"
            }
          ]
        },
        {
          "id": "1798",
          "relation": 'Origins',
          "02 optic nerve": [
            {
              "title": "Name",
              "value": "02 optic nerve"
            },
            {
              "title": "Ontology URI",
              "value": "http://purl.obolibrary.org/obo/UBERON_0000941"
            }
          ]
        },
        {
          "id": "53259",
          "relation": 'Origins',
          "10 R+L thoracic": [
            {
              "title": "Name",
              "value": "10 R+L thoracic"
            },
            {
              "title": "Ontology URI",
              "value": "http://purl.obolibrary.org/obo/UBERON_0039167"
            }
          ]
        },
        {
          "id": "6604",
          "relation": 'Origins',
          "10n": [
            {
              "title": "Name",
              "value": "10n"
            },
            {
              "title": "Ontology URI",
              "value": "http://purl.obolibrary.org/obo/UBERON_0001759"
            }
          ]
        },
        {
          "id": "52948",
          "relation": 'Origins',
          "11 R+L thoracic": [
            {
              "title": "Name",
              "value": "11 R+L thoracic"
            },
            {
              "title": "Ontology URI",
              "value": "http://purl.obolibrary.org/obo/UBERON_0038635"
            }
          ]
        },
        {
          "id": "52950",
          "relation": 'Origins',
          "11 thoracic lymph node": [
            {
              "title": "Name",
              "value": "11 thoracic lymph node"
            },
            {
              "title": "Ontology URI",
              "value": "http://purl.obolibrary.org/obo/UBERON_0038635"
            }
          ]
        },
        {
          "id": "52956",
          "relation": 'Origins',
          "12R+L thoracic lymph node": [
            {
              "title": "Name",
              "value": "12R+L thoracic lymph node"
            },
            {
              "title": "Ontology URI",
              "value": "http://purl.obolibrary.org/obo/UBERON_0038638"
            }
          ]
        },
        {
          "id": "6050",
          "relation": 'Origins',
          "12n": [
            {
              "title": "Name",
              "value": "12n"
            },
            {
              "title": "Ontology URI",
              "value": "http://purl.obolibrary.org/obo/UBERON_0001650"
            }
          ]
        }
    ];

  const mockConnections = [
        {
          "id": "5304",
          'relation': 'Derived from Same Sentence',
          "chorda tympani to lingual to geniculate ganglion to nts S2-S4 via pelvic splanchnic nerves via pelvic ganglion to uterovaginal ganglion": [
            {
              "title": "Knowledge Statement ID",
              "value": "73"
            },
            {
              "title": "Title",
              "value": "chorda tympani to lingual to geniculate ganglion to nts S2-S4 via pelvic splanchnic nerves via pelvic ganglion to uterovaginal ganglion"
            },
            {
              "title": "Statement",
              "value": "In a parasympathetic post-ganglionic phenotype connection goes from S2 spinal cord segment to accessory pelvic ganglion via 2nd toe intermediate phalanx, via pelvic ganglion and via ventral root of the first sacral spinal cord segment. This ANAXONIC projects UNKNOWN from the S2 spinal cord segment and is found at an unknown location.chorda tympani to lingual to geniculate ganglion to nts S2-S4 via pelvic splanchnic nerves via pelvic ganglion to uterovaginal ganglion"
            }
          ]
        },
        {
          "id": "32845",
          'relation': 'Others',
          "neuron type sstom 10": [
            {
              "title": "Knowledge Statement ID",
              "value": "71"
            },
            {
              "title": "Title",
              "value": "neuron type sstom 10"
            },
            {
              "title": "Statement",
              "value": "In a connection goes from to . This UNKNOWN projects UNKNOWN from the and is found at an unknown location."
            }
          ]
        },
        {
          "id": "47428",
          "relation": 'Others',
          "(mid-third) lateral capsular ligament": [
            {
              "title": "Knowledge Statement ID",
              "value": "70"
            },
            {
              "title": "Title",
              "value": "(mid-third) lateral capsular ligament"
            },
            {
              "title": "Statement",
              "value": "In a connection goes from to . This UNKNOWN projects UNKNOWN from the and is found at an unknown location."
            }
          ]
        },
        {
          "id": "12822",
          "relation": 'Others',
          "(pre-)piriform cortex": [
            {
              "title": "Knowledge Statement ID",
              "value": "69"
            },
            {
              "title": "Title",
              "value": "(pre-)piriform cortex"
            },
            {
              "title": "Statement",
              "value": "In a connection goes from to . This UNKNOWN projects UNKNOWN from the and is found at an unknown location."
            }
          ]
        },

  ];

  const getEntities = (searchValue: string) => mockEntities;

  const getConnections = (searchValue: string) => mockConnections ;

  const updateOriginsInStatment = (options: any, id: string) => {
    return false;
  }

  const updateForwardConnectionsInStatment = (options: any, id: string) => {
    return false;
  }

  copiedUISchema.origin_id = {
    "ui:widget": CustomAnatomicalField,
    "ui:options": {
      label: format === "noLabel" ? false : "Origin",
      placeholder: "Look for Origins",
      searchPlaceholder: "Search for Origins",
      noResultReason: "We couldn’t find any record with these origin in the database.",
      disabledReason: "Add Destination entity to get access to the forward connection form",
      onSearch: (searchValue: string) => getEntities(searchValue),
      onUpdate: (selectedOptions: any) => updateOriginsInStatment(selectedOptions, statement?.id),
      options: [],
      data: [],
      statement: statement,
      errors: statement?.errors?.includes("Invalid origin")
        ? statement.errors
        : "",
      value: mockEntities[0] ?? "",
    },

  };

  copiedUISchema.destination_type = {
    "ui:options": {
      label: false,
      placeholder: "Select detination type",
    },
  };

  copiedUISchema.path.items = {
    "ui:options": {
      label: false,
    },
    "ui:label": false,
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

  copiedUISchema.additional_information = {
    "ui:widget": "CustomTextField",
    "ui:options": {
      label: "Additional Information",
      placeholder: "Enter additional information on the knowledge statement",
      multiline: true,
      rows: 4,
    },
    value: statement?.additional_information ?? "",
  };

  copiedUISchema.forward_connection = {
    "ui:widget": CustomAnatomicalField,
    "ui:options": {
      label: "",
      placeholder: "Forward connection(s)",
      searchPlaceholder: "Search for Connections",
      noResultReason: "We couldn’t find any record with these origin in the database.",
      disabledReason: "Add Destination entity to get access to the forward connection form",
      onSearch: (searchValue: string) => getConnections(searchValue),
      onUpdate: (selectedOptions: any) => updateForwardConnectionsInStatment(selectedOptions, statement?.id),
      options: [],
      data: [],
      statement: statement,
      errors: statement?.errors?.includes("Invalid forward connection")
        ? statement.errors
        : "",
      value: mockConnections[0] ?? "",
    },
  };

  const widgets = {
    AnatomicalEntitiesField,
    CustomSingleSelect,
    CustomTextField,
    CustomTextArea,
    SelectWidget: CustomSingleSelect,
    CustomAutocompleteForwardConnection,
  };

  const templates = {
    ArrayFieldTemplate,
  };

  return (
    <FormBase
      data={statement}
      service={statementService}
      schema={copiedSchema}
      uiSchema={copiedUISchema}
      uiFields={uiFields}
      enableAutoSave={false}
      children={true}
      widgets={widgets}
      templates={templates}
      showErrorList={false}
      submitOnBlurFields={[
        "knowledge_statement",
        "additional_information",
        "apinatomy_model",
      ]}
      submitOnChangeFields={[
        "phenotype_id",
        "sex_id",
        "laterality",
        "circuit_type",
        "projection",
        "destination_type",
        "path_type",
      ]}
      {...props}
    />
  );
};

export default StatementForm;
