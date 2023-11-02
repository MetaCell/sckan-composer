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
import { Box, Chip, MenuItem, Select } from "@mui/material";
import CustomEntitiesDropdown from "../Widgets/CustomEntitiesDropdown";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import AcUnitIcon from "@mui/icons-material/AcUnit";
const StatementForm = (props: any) => {
  const { uiFields, statement, setter, format } = props;
  const { schema, uiSchema } = jsonSchemas.getConnectivityStatementSchema();
  const copiedSchema = JSON.parse(JSON.stringify(schema));
  const copiedUISchema = JSON.parse(JSON.stringify(uiSchema));
  // TODO: set up the widgets for the schema
  copiedSchema.title = "";
  copiedSchema.properties.destinations.title = "";
  copiedSchema.properties.destinations.name = "Destination";
  copiedSchema.properties.destinations.items.properties = {
    ...schema.properties.destinations.items.properties,
    anatomical_entities: {
      type: "string",
      title: "anatomical_entities",
    },
    from_entities: {
      type: "string",
      title: "anatomical_entities",
    },
  };
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
      label: "ApiNATOMY Model Name",
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

  const mockEntities = [
    {
      id: "5304",
      group: "Origins",
      label: "('Aortic arch', 'arch of aorta')",
      content: [
        {
          title: "Name",
          value: "('Aortic arch', 'arch of aorta')",
        },
        {
          title: "Ontology URI",
          value: "http://purl.obolibrary.org/obo/UBERON_0001508",
        },
      ],
    },
    {
      id: "32845",
      group: "Origins",
      label: "(embryonic) hindbrain flexure",
      content: [
        {
          title: "Name",
          value: "(embryonic) hindbrain flexure",
        },
        {
          title: "Ontology URI",
          value: "http://purl.obolibrary.org/obo/UBERON_0005820",
        },
      ],
    },
    {
      id: "47428",
      group: "Origins",
      label: "(mid-third) lateral capsular ligament",
      content: [
        {
          title: "Name",
          value: "(mid-third) lateral capsular ligament",
        },
        {
          title: "Ontology URI",
          value: "http://purl.obolibrary.org/obo/UBERON_0014899",
        },
      ],
    },
    {
      id: "12822",
      group: "Origins",
      label: "(pre-)piriform cortex",
      content: [
        {
          title: "Name",
          value: "(pre-)piriform cortex",
        },
        {
          title: "Ontology URI",
          value: "http://purl.obolibrary.org/obo/UBERON_0002590",
        },
      ],
    },
    {
      id: "1798",
      group: "Origins",
      label: "02 optic nerve",
      content: [
        {
          title: "Name",
          value: "02 optic nerve",
        },
        {
          title: "Ontology URI",
          value: "http://purl.obolibrary.org/obo/UBERON_0000941",
        },
      ],
    },
    {
      id: "53259",
      group: "Origins",
      label: "10 R+L thoracic",
      content: [
        {
          title: "Name",
          value: "10 R+L thoracic",
        },
        {
          title: "Ontology URI",
          value: "http://purl.obolibrary.org/obo/UBERON_0039167",
        },
      ],
    },
    {
      id: "6604",
      group: "Origins",
      label: "10n",
      content: [
        {
          title: "Name",
          value: "10n",
        },
        {
          title: "Ontology URI",
          value: "http://purl.obolibrary.org/obo/UBERON_0001759",
        },
      ],
    },
    {
      id: "52948",
      group: "Origins",
      label: "11 R+L thoracic",
      content: [
        {
          title: "Name",
          value: "11 R+L thoracic",
        },
        {
          title: "Ontology URI",
          value: "http://purl.obolibrary.org/obo/UBERON_0038635",
        },
      ],
    },
    {
      id: "52950",
      group: "Origins",
      label: "11 thoracic lymph node",
      content: [
        {
          title: "Name",
          value: "11 thoracic lymph node",
        },
        {
          title: "Ontology URI",
          value: "http://purl.obolibrary.org/obo/UBERON_0038635",
        },
      ],
    },
    {
      id: "52956",
      group: "Origins",
      label: "12R+L thoracic lymph node",
      content: [
        {
          title: "Name",
          value: "12R+L thoracic lymph node",
        },
        {
          title: "Ontology URI",
          value: "http://purl.obolibrary.org/obo/UBERON_0038638",
        },
      ],
    },
    {
      id: "6050",
      group: "Origins",
      label: "12n",
      content: [
        {
          title: "Name",
          value: "12n",
        },
        {
          title: "Ontology URI",
          value: "http://purl.obolibrary.org/obo/UBERON_0001650",
        },
      ],
    },
  ];

  const mockConnections = [
    {
      id: "5304",
      group: "Derived from Same Sentence",
      label:
        "chorda tympani to lingual to geniculate ganglion to nts S2-S4 via pelvic splanchnic nerves via pelvic ganglion to uterovaginal ganglion",
      content: [
        {
          title: "Knowledge Statement ID",
          value: "73",
        },
        {
          title: "Title",
          value:
            "chorda tympani to lingual to geniculate ganglion to nts S2-S4 via pelvic splanchnic nerves via pelvic ganglion to uterovaginal ganglion",
        },
        {
          title: "Statement",
          value:
            "In a parasympathetic post-ganglionic phenotype connection goes from S2 spinal cord segment to accessory pelvic ganglion via 2nd toe intermediate phalanx, via pelvic ganglion and via ventral root of the first sacral spinal cord segment. This ANAXONIC projects UNKNOWN from the S2 spinal cord segment and is found at an unknown location.chorda tympani to lingual to geniculate ganglion to nts S2-S4 via pelvic splanchnic nerves via pelvic ganglion to uterovaginal ganglion",
        },
      ],
    },
    {
      id: "32845",
      group: "Others",
      label: "neuron type sstom 10",
      content: [
        {
          title: "Knowledge Statement ID",
          value: "71",
        },
        {
          title: "Title",
          value: "neuron type sstom 10",
        },
        {
          title: "Statement",
          value:
            "In a connection goes from to . This UNKNOWN projects UNKNOWN from the and is found at an unknown location.",
        },
      ],
    },
    {
      id: "47428",
      group: "Others",
      label: "(mid-third) lateral capsular ligament",
      content: [
        {
          title: "Knowledge Statement ID",
          value: "70",
        },
        {
          title: "Title",
          value: "(mid-third) lateral capsular ligament",
        },
        {
          title: "Statement",
          value:
            "In a connection goes from to . This UNKNOWN projects UNKNOWN from the and is found at an unknown location.",
        },
      ],
    },
    {
      id: "12822",
      group: "Others",
      label: "(pre-)piriform cortex",
      content: [
        {
          title: "Knowledge Statement ID",
          value: "69",
        },
        {
          title: "Title",
          value: "(pre-)piriform cortex",
        },
        {
          title: "Statement",
          value:
            "In a connection goes from to . This UNKNOWN projects UNKNOWN from the and is found at an unknown location.",
        },
      ],
    },
  ];

  const getEntities = (searchValue: string) => mockEntities;

  const getConnections = (searchValue: string) => mockConnections;

  const updateOriginsInStatment = (options: any, id: string) => {
    return false;
  };

  const updateForwardConnectionsInStatment = (options: any, id: string) => {
    return false;
  };

  copiedUISchema.origin_id = {
    "ui:widget": CustomEntitiesDropdown,
    "ui:options": {
      placeholder: "Look for Origins",
      searchPlaceholder: "Search for Origins",
      noResultReason:
        "We couldn’t find any record with these origin in the database.",
      disabledReason:
        "Add Destination entity to get access to the forward connection form",
      onSearch: (searchValue: string) => getEntities(searchValue),
      onUpdate: (selectedOptions: any) =>
        updateOriginsInStatment(selectedOptions, statement?.id),
      statement: statement,
      errors: statement?.errors?.includes("Invalid origin")
        ? statement.errors
        : "",
      value: mockEntities[0] ?? "",
      CustomFooter: ({ entity }: any) => (
        <Box
          sx={{
            mt: "1.5rem",
            display: "flex",
            gap: 1,
            flexWrap: "wrap",
            pt: "1.5rem",
            borderTop: "0.0625rem solid #F2F4F7",
          }}
        >
          {/* <Chip variant="filled" color="error" label={"https://google.com"} /> */}
          <Chip variant="outlined" label={"https://google.com"} />
        </Box>
      ),
    },
  };

  copiedUISchema.destinations = {
    "ui:ArrayFieldTemplate": ArrayFieldTemplate,
    items: {
      "ui:options": {
        label: false,
      },
      "ui:label": false,
      type: {
        "ui:widget": "CustomSingleSelect",
        "ui:options": {
          label: false,
        },
      },
      anatomical_entities: {
        "ui:widget": CustomEntitiesDropdown,
        "ui:options": {
          placeholder: "Look for Destinations",
          searchPlaceholder: "Search for Destinations",
          noResultReason:
            "We couldn’t find any record with these destination in the database.",
          disabledReason: "",
          onSearch: (searchValue: string) => getEntities(searchValue),
          onUpdate: (selectedOptions: any) =>
            updateOriginsInStatment(selectedOptions, statement?.id),
          statement: statement,
          errors: statement?.errors?.includes("Invalid origin")
            ? statement.errors
            : "",
          value: mockEntities[0] ?? "",
          CustomFooter: ({ entity }: any) => (
            <Box
              sx={{
                mt: "1.5rem",
                display: "flex",
                gap: 1,
                flexWrap: "wrap",
                pt: "1.5rem",
                borderTop: "0.0625rem solid #F2F4F7",
              }}
            >
              {/* <Chip variant="filled" color="error" label={"https://google.com"} /> */}
              <Chip variant="outlined" label={"https://google.com"} />
            </Box>
          ),
        },
      },
      from_entities: {
        "ui:widget": CustomEntitiesDropdown,
        "ui:options": {
          placeholder: "Look for Destinations",
          searchPlaceholder: "Search for Destinations",
          noResultReason:
            "We couldn’t find any record with these destination in the database.",
          disabledReason: "",
          onSearch: (searchValue: string) => getEntities(searchValue),
          onUpdate: (selectedOptions: any) =>
            updateOriginsInStatment(selectedOptions, statement?.id),
          statement: statement,
          errors: statement?.errors?.includes("Invalid origin")
            ? statement.errors
            : "",
          value: mockEntities[0] ?? "",
          CustomFooter: ({ entity }: any) => (
            <Box
              sx={{
                mt: "1.5rem",
                display: "flex",
                gap: 1,
                flexWrap: "wrap",
                pt: "1.5rem",
                borderTop: "0.0625rem solid #F2F4F7",
              }}
            >
              {/* <Chip variant="filled" color="error" label={"https://google.com"} /> */}
              <Chip variant="outlined" label={"https://google.com"} />
            </Box>
          ),
        },
      },
    },
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
    "ui:widget": CustomEntitiesDropdown,
    "ui:options": {
      entity: "Connections",
      placeholder: "Forward connection(s)",
      searchPlaceholder: "Search for Knowledge Statements",
      noResultReason:
        "We couldn’t find any record with these origin in the database.",
      disabledReason:
        "Add Destination entity to get access to the forward connection form",
      onSearch: (searchValue: string) => getConnections(searchValue),
      onUpdate: (selectedOptions: any) =>
        updateForwardConnectionsInStatment(selectedOptions, statement?.id),
      statement: statement,
      errors: statement?.errors?.includes("Invalid forward connection")
        ? statement.errors
        : "",
      value: mockConnections[0] ?? "",
      header: {
        label: "Origins",
        values: [
          "Major pelvic ganglion",
          "Prevertebral sympathetic ganglion in abdominal aortic plexus",
          "Accessory pelvic ganglion",
        ],
      },
      CustomInputChip: ({ entity, sx = {} }: any) => (
        <Chip
          key={entity?.id}
          variant={"filled"}
          onClick={(e) => {
            e.stopPropagation();
          }}
          deleteIcon={<OpenInNewIcon sx={{ fill: "#548CE5" }} />}
          onDelete={(e) => {
            e.stopPropagation();
          }}
          label={entity?.label}
          sx={{ ...sx }}
        />
      ),
      CustomHeader: ({ entity }: any) => (
        <Box
          sx={{
            mb: "1.5rem",
            pb: "1.5rem",
            borderBottom: "0.0625rem solid #F2F4F7",
          }}
        >
          <Chip variant="outlined" label={"https://google.com"} />
        </Box>
      ),
      CustomFooter: ({ entity }: any) => (
        <Box
          sx={{
            mt: "1.5rem",
            pt: "1.5rem",
            borderTop: "0.0625rem solid #F2F4F7",
          }}
        >
          <Chip variant="filled" color="success" label={"https://google.com"} />
        </Box>
      ),
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
        "destinations",
        "path_type",
      ]}
      {...props}
    />
  );
};

export default StatementForm;
