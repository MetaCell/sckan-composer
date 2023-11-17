import React from "react";
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
import { Box, Chip } from "@mui/material";
import CustomEntitiesDropdown from "../Widgets/CustomEntitiesDropdown";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import {
  createOptionsFromStatements,
  getAnatomicalEntities,
  getConnectionId, getFirstNumberFromString,
  searchForwardConnection,
  searchFromEntitiesDestination,
  searchFromEntitiesVia,
  updateEntity,
  updateForwardConnections,
  updateOrigins,
} from "../../services/CustomDropdownService";
import {
  mapAnatomicalEntitiesToOptions,
  DROPDOWN_MAPPER_STATE, getViasGroupLabel, findMatchingEntities, sortFromViasEntities,
} from "../../helpers/dropdownMappers";
import { DestinationIcon, ViaIcon } from "../icons";
import {
  DestinationsGroupLabel,
  OriginsGroupLabel,
  ViasGroupLabel,
} from "../../helpers/settings";
import { Option, OptionDetail } from "../../types";
import { composerApi as api } from "../../services/apis";
import { ConnectivityStatement, TypeC11Enum } from "../../apiclient/backend";
import { CustomFooter } from "../Widgets/HoveredOptionContent";
import {StatementStateChip} from "../Widgets/StateChip";
import {searchAnatomicalEntities} from "../../helpers/helpers";

const StatementForm = (props: any) => {
  const { uiFields, statement, refreshStatement } = props;
  const { schema, uiSchema } = jsonSchemas.getConnectivityStatementSchema();
  const copiedSchema = JSON.parse(JSON.stringify(schema));
  const copiedUISchema = JSON.parse(JSON.stringify(uiSchema));
  // TODO: set up the widgets for the schema
  copiedSchema.title = "";
  copiedSchema.properties.destinations.title = "";

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

  const selectedOrigins = statement.origins.map((origin: Option) => origin.id);

  copiedUISchema.origins = {
    "ui:widget": CustomEntitiesDropdown,
    "ui:options": {
      statement: statement,
      placeholder: "Origin",
      searchPlaceholder: "Search for Origins",
      noResultReason: "No results found",
      disabledReason: "",
      chipsNumber: 5,
      onSearch: async (searchValue: string, formId: string) => {
        const excludedIds = searchValue ? [] : selectedOrigins;
        return getAnatomicalEntities(
          searchValue,
          OriginsGroupLabel,
          excludedIds,
        );
      },
      onUpdate: async (selectedOptions: any) => {
        await updateOrigins(selectedOptions, statement.id);
        refreshStatement();
      },
      errors: "",
      mapValueToOption: () =>
        mapAnatomicalEntitiesToOptions(statement?.origins, OriginsGroupLabel),
    },
  };

  const getAnatomicalEntitiesForForm = async (
    searchValue: string,
    formId: string,
    statement: any,
    groupLabel: string,
    type: "vias" | "destinations",
    property: "from_entities" | "anatomical_entities",
  ) => {
    let selectedIds: number[] = [];
    const currentIndex = getFirstNumberFromString(formId);

    if (currentIndex !== null && currentIndex !== undefined) {
      const currentElement = statement[type][currentIndex];

      if (currentElement) {
        selectedIds =
          currentElement[property]?.map((entity: Option) => entity.id) || [];
      }
    }

    const excludeIds = searchValue ? [] : selectedIds;

    if (property === "from_entities" && type === "destinations") {
      return searchFromEntitiesDestination(searchValue, statement, excludeIds);
    } else if (property === "from_entities" && type === "vias") {
      return searchFromEntitiesVia(searchValue, statement, formId, excludeIds);
    } else {
      return getAnatomicalEntities(searchValue, groupLabel, excludeIds);
    }
  };

  copiedUISchema.vias = {
    "ui:ArrayFieldTemplate": (props: any) => (
      <ArrayFieldTemplate
        {...props}
        onElementDelete={async (element: any) => {
          await api.composerViaDestroy(element.children.props.formData.id);
          refreshStatement();
        }}
        onElementAdd={async (element: any) => {
          await api.composerViaCreate({
            id: -1,
            order: statement.vias.length,
            connectivity_statement: statement.id,
            anatomical_entities: [],
            from_entities: [],
          });
          refreshStatement();
        }}
        onElementReorder={async (
          sourceIndex: number,
          destinationIndex: number,
        ) => {
          await api.composerViaPartialUpdate(statement.vias[sourceIndex].id, {
            order: destinationIndex,
          });
          refreshStatement();
        }}
        hideDeleteBtn={statement.vias.length <= 1}
        showReOrderingIcon={true}
        addButtonPlaceholder={"Via"}
      />
    ),
    items: {
      "ui:options": {
        label: false,
      },
      "ui:label": false,
      order: {
        "ui:widget": "hidden",
      },
      type: {
        "ui:widget": "CustomSingleSelect",
        "ui:options": {
          label: false,
          isPathBuilderComponent: true,
          InputIcon: ViaIcon,
        },
      },
      anatomical_entities: {
        "ui:widget": CustomEntitiesDropdown,
        "ui:options": {
          statement: statement,
          label: "Via",
          placeholder: "Look for vias",
          searchPlaceholder: "Search for vias",
          noResultReason: "No anatomical entities found",
          disabledReason: "",
          onSearch: async (searchValue: string, formId: string) => {
            return getAnatomicalEntitiesForForm(
              searchValue,
              formId,
              statement,
              ViasGroupLabel,
              "vias",
              "anatomical_entities",
            );
          },
          onUpdate: async (selectedOptions: Option[], formId: any) => {
            await updateEntity({
              selected: selectedOptions,
              entityId: getConnectionId(formId, statement.vias),
              entityType: "via",
              propertyToUpdate: "anatomical_entities",
            });
            refreshStatement();
          },
          errors: "",
          mapValueToOption: (anatomicalEntities: any[]) =>
            mapAnatomicalEntitiesToOptions(anatomicalEntities, ViasGroupLabel),
          CustomFooter: CustomFooter,
        },
      },
      from_entities: {
        "ui:widget": CustomEntitiesDropdown,
        "ui:options": {
          label: "From",
          placeholder: "Look for connections",
          searchPlaceholder: "Search for connections",
          noResultReason: "No prior connections found",
          disabledReason: "",
          onSearch: async (searchValue: string, formId: string) => {
            return getAnatomicalEntitiesForForm(
              searchValue,
              formId,
              statement,
              ViasGroupLabel,
              "vias",
              "from_entities",
            );
          },
          onUpdate: async (selectedOptions: Option[], formId: any) => {
            await updateEntity({
              selected: selectedOptions,
              entityId: getConnectionId(formId, statement.vias),
              entityType: "via",
              propertyToUpdate: "from_entities",
            });
            refreshStatement();
          },
          errors: "",
          mapValueToOption: (anatomicalEntities: any[], formId: any) => {
            const entities: Option[] = [];
            const selected = findMatchingEntities(statement, anatomicalEntities)
            selected.forEach((row: any) => {
              entities.push(mapAnatomicalEntitiesToOptions([row], getViasGroupLabel(row.order))[0]);
            })
            return sortFromViasEntities(entities)
          },
          CustomFooter: CustomFooter,
        },
      },
    },
  };

  copiedUISchema.destinations = {
    "ui:ArrayFieldTemplate": (props: any) => (
      <ArrayFieldTemplate
        {...props}
        onElementDelete={async (element: any) => {
          await api.composerDestinationDestroy(
            element.children.props.formData.id,
          );
          refreshStatement();
        }}
        onElementAdd={async (element: any) => {
          await api.composerDestinationCreate({
            id: -1,
            connectivity_statement: statement.id,
            type: TypeC11Enum.AxonT,
            anatomical_entities: [],
            from_entities: [],
          });
          refreshStatement();
        }}
        hideDeleteBtn={statement.destinations.length <= 1}
        showReOrderingIcon={false}
        addButtonPlaceholder={"Destination"}
      />
    ),
    items: {
      "ui:options": {
        label: false,
      },
      "ui:label": false,
      order: {
        "ui:widget": "hidden",
      },
      type: {
        "ui:widget": "CustomSingleSelect",
        "ui:options": {
          label: false,
          isPathBuilderComponent: true,
          InputIcon: DestinationIcon,
        },
      },
      anatomical_entities: {
        "ui:widget": CustomEntitiesDropdown,
        "ui:options": {
          placeholder: "Look for Destinations",
          searchPlaceholder: "Search for Destinations",
          noResultReason: "No anatomical entities found",
          disabledReason: "",
          onSearch: async (searchValue: string, formId: string) => {
            return getAnatomicalEntitiesForForm(
              searchValue,
              formId,
              statement,
              DestinationsGroupLabel,
              "destinations",
              "anatomical_entities",
            );
          },
          onUpdate: async (selectedOptions: Option[], formId: string) => {
            await updateEntity({
              selected: selectedOptions,
              entityId: getConnectionId(formId, statement.destinations),
              entityType: "destination",
              propertyToUpdate: "anatomical_entities",
            });
            refreshStatement();
          },
          errors: "",
          mapValueToOption: (anatomicalEntities: any[]) =>
            mapAnatomicalEntitiesToOptions(
              anatomicalEntities,
              DestinationsGroupLabel,
            ),
          CustomFooter: CustomFooter,
        },
      },
      from_entities: {
        "ui:widget": CustomEntitiesDropdown,
        "ui:options": {
          statement: statement,
          label: "From",
          placeholder: "Look for Destinations",
          searchPlaceholder: "Search for Destinations",
          noResultReason: "",
          disabledReason: "",
          onSearch: async (searchValue: string, formId: string) => {
            return getAnatomicalEntitiesForForm(
              searchValue,
              formId,
              statement,
              ViasGroupLabel,
              "destinations",
              "from_entities",
            );
          },
          onUpdate: async (selectedOptions: Option[], formId: string) => {
            await updateEntity({
              selected: selectedOptions,
              entityId: getConnectionId(formId, statement.destinations),
              entityType: "destination",
              propertyToUpdate: "from_entities",
            });
            refreshStatement();
          },
          errors: "",
          mapValueToOption: (anatomicalEntities: any[], formId: any) => {
            const entities: Option[] = [];
            const selected = findMatchingEntities(statement, anatomicalEntities)
            selected.forEach((row: any) => {
              entities.push(mapAnatomicalEntitiesToOptions([row], getViasGroupLabel(row.order + 1))[0]);
            })
            return  sortFromViasEntities(entities)
          },
          CustomFooter: CustomFooter,
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
  const selectedForwardConnection = statement.forward_connection.map(
    (origin: Option) => origin.id,
  );

  copiedUISchema.forward_connection = {
    "ui:widget": CustomEntitiesDropdown,
    "ui:options": {
      isFormDisabled: () => statement.destinations.length === 0,
      placeholder: "Forward connection(s)",
      searchPlaceholder: "Search for Connectivity Statements",
      noResultReason:
        "We couldn’t find any record with these origin in the database.",
      disabledReason:
        "Add Destination entity to get access to the forward connection form",
      onSearch: async (searchValue: string) => {
        const excludedIds = searchValue ? [] : selectedForwardConnection;
        return searchForwardConnection(searchValue, statement, excludedIds);
      },
      onUpdate: async (selectedOptions: Option[]) => {
        await updateForwardConnections(selectedOptions, statement);
        refreshStatement();
      },
      statement: statement,
      errors: statement?.errors?.includes("Invalid forward connection")
        ? statement.errors
        : "",
      mapValueToOption: (connectivityStatements: ConnectivityStatement[]) =>
        createOptionsFromStatements(
          connectivityStatements,
          statement.sentence_id,
        ),
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
      CustomHeader: ({ entity }: any) => {
        const stateDetail = entity.content.find(
          (detail: OptionDetail) => detail.title === DROPDOWN_MAPPER_STATE,
        );
        const stateValue = stateDetail
          ? stateDetail.value
          : "State not available";

                return (
                  <Box
                    sx={{
                      mt: "1.5rem",
                      display: "flex",
                      gap: 1,
                      flexWrap: "wrap",
                      pb: "1.5rem",
                    }}
                  >
                    <StatementStateChip value={stateValue} />
                  </Box>
                );
            },
        },
    };

  const widgets = {
    AnatomicalEntitiesField,
    CustomSingleSelect,
    CustomTextField,
    CustomTextArea,
    SelectWidget: CustomSingleSelect,
  };

  return (
    <FormBase
      data={statement}
      service={statementService}
      schema={copiedSchema}
      uiSchema={copiedUISchema}
      uiFields={uiFields}
      enableAutoSave={false}
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
      ]}
      {...props}
    />
  );
};

export default StatementForm;
