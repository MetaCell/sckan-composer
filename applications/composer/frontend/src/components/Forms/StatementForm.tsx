import React, { forwardRef, useEffect, useState } from "react";
import { FormBase } from "./FormBase";
import { jsonSchemas } from "../../services/JsonSchema";
import statementService from "../../services/StatementService";
import CustomTextField from "../Widgets/CustomTextField";
import CustomSingleSelect from "../Widgets/CustomSingleSelect";
import CustomTextArea from "../Widgets/CustomTextArea";
import ArrayFieldTemplate from "../Widgets/ArrayFieldTemplate";
import AnatomicalEntitiesField from "../AnatomicalEntitiesField";
import { sexes } from "../../services/SexService";
import { populations } from "../../services/PopulationService";
import { phenotypes } from "../../services/PhenotypeService";
import { Box, Chip } from "@mui/material";
import CustomEntitiesDropdown from "../Widgets/CustomEntitiesDropdown";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import {
  createOptionsFromStatements,
  getAnatomicalEntities,
  getConnectionId,
  getFirstNumberFromString,
  searchForwardConnection,
  searchFromEntitiesDestination,
  searchFromEntitiesVia,
  updateEntity,
  updateForwardConnections,
  updateOrigins,
} from "../../services/CustomDropdownService";
import {
  DROPDOWN_MAPPER_STATE,
  findMatchingEntities,
  getViasGroupLabel,
  mapAnatomicalEntitiesToOptions,
} from "../../helpers/dropdownMappers";
import { DestinationIcon, ViaIcon } from "../icons";
import { ChangeRequestStatus, DestinationsGroupLabel, OriginsGroupLabel, ViasGroupLabel, } from "../../helpers/settings";
import { Option, OptionDetail } from "../../types";
import { composerApi as api } from "../../services/apis";
import { ConnectivityStatement, ViaTypeEnum, DestinationTypeEmum, } from "../../apiclient/backend";
import { CustomFooter } from "../Widgets/HoveredOptionContent";
import { StatementStateChip } from "../Widgets/StateChip";
import { projections } from "../../services/ProjectionService";
import { checkOwnership, getOwnershipAlertMessage } from "../../helpers/ownershipAlert";
import { useDispatch } from "react-redux";
import { setWasChangeDetected } from "../../redux/statementSlice";
import { AutocompleteWithChips } from "../Widgets/AutocompleteWithChips";

const StatementForm = forwardRef((props: any, ref: React.Ref<HTMLTextAreaElement>) => {
  const { uiFields, statement, isDisabled, action: refreshStatement, onInputBlur, alertId, currentExpanded, onInputFocus } = props;
  const { schema, uiSchema } = jsonSchemas.getConnectivityStatementSchema();
  const copiedSchema = JSON.parse(JSON.stringify(schema));
  const copiedUISchema = JSON.parse(JSON.stringify(uiSchema));
  const [relationshipOptions, setRelationshipOptions] = useState<any[]>([]);

  const dispatch = useDispatch();
  // TODO: set up the widgets for the schema
  copiedSchema.title = "";
  copiedSchema.properties.destinations.title = "";
  copiedSchema.properties.statement_alerts.items.properties.alert_type.type = "number";
  copiedSchema.properties.statement_alerts.items.properties.connectivity_statement_id.type = "number";
  copiedSchema.properties.statement_triples.title = " ";
  copiedSchema.properties.forward_connection.type = ["string", "null"];
  copiedUISchema["ui:order"] = ["curie_id", "destination_type", "*"];
  copiedSchema.properties.statement_alerts.title = " ";
  copiedSchema.properties.statement_alerts.items.required = ["alert_type"]

  copiedUISchema.statement_triples = {
    "ui:order": uiSchema.statement_triples["ui:order"] || Object.keys(copiedSchema.properties.statement_triples.properties),
    ...Object.entries(copiedSchema.properties.statement_triples.properties).reduce<Record<string, any>>((acc, [key, prop]) => {
      const property = prop as { type?: string | string[]; title?: string };
      const isDropdown = Array.isArray(property.type) && property.type.includes("null");
      const isMultiSelect = property.type === "array";
      /* eslint-disable eqeqeq */
      const relationshipOption = relationshipOptions.find((option: any) => option.id == key)?.options.map((option: any) => ({
        label: option.name,
        value: option.id
      }));

      return {
        ...acc,
        [key]: {
          "ui:widget": isMultiSelect ? "AutocompleteWithChips" : (isDropdown ? "CustomSingleSelect" : "CustomTextField"),
          "ui:options": isMultiSelect ? {
            options: relationshipOption || [],
            placeholder: "Select statement triples...",
            data: statement?.statement_triples?.[key]?.map((item: any) => {
              const relationship = relationshipOptions.find((rel: any) => rel.id === Number(key));
              const option = relationship?.options.find((opt: any) => opt.id === item.value);
              return {
                label: option?.name || '',
                value: item.value
              };
            }) || [],

            removeChip: async (id: number) => {
              const deleteId = statement?.statement_triples?.[key]?.find((triple: any) => triple.value === id)?.id;
              await statementService.deleteRelationship(deleteId);
              refreshStatement();
            },
            label: property.title,
            isDisabled,
            onAutocompleteChange: async (event: any, newValue: any[]) => {
              const lastSelectedValue = newValue[newValue.length - 1];
              const currentTriples = statement?.statement_triples?.[key] || [];

              // Check if the lastSelectedValue exists in currentTriples
              const existingTriple = currentTriples.find((triple: any) => triple.value === lastSelectedValue?.value);

              // Check if the value exists in newValue (excluding lastSelectedValue)
              const isDuplicateInNewValue = newValue.slice(0, -1).some((value: any) => value.value === lastSelectedValue?.value);

              if (existingTriple || isDuplicateInNewValue) {
                // If it exists in currentTriples or is duplicated in newValue, it's a removal
                if (existingTriple) {
                  await statementService.deleteRelationship(Number(existingTriple.id));
                }
              } else if (lastSelectedValue) {
                // If it doesn't exist in currentTriples and isn't duplicated in newValue, it's a new selection
                await statementService.assignRelationship({
                  id: key,
                  connectivity_statement: statement.id,
                  relationship: key,
                  value: Number(lastSelectedValue.value)
                });
              }

              refreshStatement();
            }
          } : {
            data: relationshipOption || [],
            onChange2: async (value: any) => {
              const previousValue = statement?.statement_triples?.[key]?.id;
              if (previousValue && value === null) {
                await statementService.deleteRelationship(previousValue);
              } else if (value !== null && !previousValue) {
                await statementService.assignRelationship({
                  id: key,
                  connectivity_statement: statement.id,
                  relationship: key,
                  value: value.toString()
                });
              } else if (value !== null && previousValue) {
                await statementService.updateRelationship(previousValue, {
                  connectivity_statement: statement.id,
                  relationship: key,
                  value: value
                });
              }

              if (value !== statement?.statement_triples?.[key]?.value) {
                refreshStatement();
              }
            },
            onBlur2: async (value: any) => {
              const previousValue = statement?.statement_triples?.[key]?.id;

              if (value.trim() === "" && previousValue) {
                await statementService.deleteRelationship(previousValue);
              } else if (!previousValue && value.trim() !== "") {
                await statementService.assignRelationship({
                  id: key,
                  connectivity_statement: statement.id,
                  relationship: key,
                  value: value
                });
              } else if (previousValue) {
                await statementService.updateRelationship(previousValue, {
                  connectivity_statement: statement.id,
                  relationship: key,
                  value: value
                });
              }
              if (value !== statement?.statement_triples?.[key]?.value) {
                refreshStatement();
              }
            },
            isDisabled,
            value: statement?.statement_triples?.[key]?.value || '',
            label: property.title,
          }
        }
      };
    }, {})
  };


  copiedUISchema.statement_alerts = {
    "ui:options": {
      orderable: false,
      addable: false,
      removable: false,
      label: false,
    },
    items: {
      "ui:label": false,

      id: {
        "ui:widget": "hidden",
      },
      alert_type: {
        "ui:widget": "hidden",
      },
      text: {
        "ui:widget": "CustomTextArea",
        "ui:options": {
          placeholder: "Enter alert text here...",
          rows: 3,
          onBlur: onInputBlur,
          onFocus: onInputFocus,
          ref: ref,
          alertId,
          currentExpanded
        },
      },
      connectivity_statement_id: {
        "ui:widget": "hidden",
      }
    },
  }


  copiedUISchema.curie_id = {
    "ui:widget": "CustomTextField",
    "ui:options": {
      isDisabled: true,
      label: "Short Name",
      placeholder: "Short Name",
      classNames: statement?.curie_id && statement.curie_id.trim() === "" ? "" : "",
      hidden: !statement?.curie_id || statement.curie_id.trim() === "",
    },
    value: statement?.curie_id ?? "",
  };

  copiedUISchema.circuit_type = {
    "ui:widget": "CustomSingleSelect",
    "ui:options": {
      isDisabled,
      label: "Circuit Type",
      classNames: "col-xs-12 col-md-6",
      placeholder: "Enter Circuit Type",
    },
  };

  copiedUISchema.laterality = {
    "ui:widget": "CustomSingleSelect",
    "ui:options": {
      isDisabled,
      label: "Laterality",
      classNames: "col-xs-12 col-md-6",
      placeholder: "Enter Laterality",
    },
  };


  copiedUISchema.projection = {
    "ui:widget": "CustomSingleSelect",
    "ui:options": {
      isDisabled,
      label: "Projection laterality",
      classNames: "col-xs-12 col-md-6",
      placeholder: "Enter Projection Laterality",
    },
  };


  copiedUISchema.projection_phenotype_id = {
    "ui:widget": "CustomSingleSelect",
    "ui:options": {
      isDisabled,
      label: "Projection phenotype",
      classNames: "col-xs-12 col-md-6",
      placeholder: "Enter Projection Phenotype",
      data: projections.getProjections().map((row: any) => ({
        label: row.name,
        value: row.id,
      })),
    },
    value: statement?.projection_phenotype_id ?? "",
  };




  copiedUISchema.apinatomy_model = {
    "ui:widget": "CustomTextField",
    "ui:options": {
      isDisabled,
      label: "ApiNATOMY Model Name",
      placeholder: "Enter ApiNATOMY Model Name",
    },
    value: statement?.apinatomy_model ?? "",
  };

  copiedUISchema.sex_id = {
    "ui:widget": "CustomSingleSelect",
    "ui:options": {
      isDisabled,
      label: "Sex",
      placeholder: "Enter Sex",
      data: sexes
        .getSexes()
        .map((row: any) => ({ label: row.name, value: row.id })),
    },
    value: statement?.sex_id ?? "",
  };
  copiedUISchema.population_id = {
    "ui:widget": "CustomSingleSelect",
    "ui:options": {
      isDisabled: statement.has_statement_been_exported,
      label: "Population Set",
      placeholder: "Enter Population",
      data: populations.getPopulations().map((row: any) => ({
        label: row.name,
        value: row.id,
      })),
    },
    value: statement?.population_id ?? "",
  };

  copiedUISchema.phenotype_id = {
    "ui:widget": "CustomSingleSelect",
    "ui:options": {
      isDisabled,
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
      isDisabled,
      label: "Knowledge Statement",
      placeholder: "Enter Knowledge Statement",
      rows: 4,
      value: statement?.knowledge_statement ?? "",
    },
  };

  copiedUISchema.origins = {
    "ui:widget": CustomEntitiesDropdown,
    "ui:options": {
      isDisabled,
      statement: statement,
      placeholder: "Origin",
      searchPlaceholder: "Search for Origins",
      noResultReason: "No results found",
      disabledReason: "",
      fieldName: "origins",
      chipsNumber: 5,
      minWidth: "50rem",
      refreshStatement: refreshStatement,
      onSearch: async (
        searchValue: string,
        formId: string,
        selectedOptions: Option[],
      ) => {
        const excludedIds = selectedOptions.map((origin: Option) =>
          Number(origin.id),
        );
        return getAnatomicalEntities(
          searchValue,
          OriginsGroupLabel,
          excludedIds,
        );
      },
      onUpdate: async (selectedOptions: any) => {
        return await updateOrigins(selectedOptions, statement.id, refreshStatement, dispatch);
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
    selectedOptions: Option[],
  ) => {
    const selectedIds = selectedOptions.map((entity: Option) =>
      Number(entity.id),
    );
    if (property === "from_entities" && type === "destinations") {
      return searchFromEntitiesDestination(searchValue, statement, selectedIds);
    } else if (property === "from_entities" && type === "vias") {
      return searchFromEntitiesVia(searchValue, statement, formId, selectedIds);
    } else {
      return getAnatomicalEntities(searchValue, groupLabel, selectedIds);
    }
  };

  copiedUISchema.vias = {
    "ui:ArrayFieldTemplate": (props: any) => (
      <ArrayFieldTemplate
        {...props}
        id={statement.id}
        onElementDelete={async (element: any) => {
          await api.composerViaDestroy(element.children.props.formData.id);
          dispatch(setWasChangeDetected(true));
          refreshStatement();
        }}
        onElementAdd={async () => {
          await api.composerViaCreate({
            id: -1,
            order: statement?.vias?.length,
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
          dispatch(setWasChangeDetected(true));
          refreshStatement();
        }}
        hideDeleteBtn={statement?.vias?.length < 1 || isDisabled}
        showReOrderingIcon={true}
        addButtonPlaceholder={"Via"}
        canAdd={!isDisabled}
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
        "ui:CustomSingleSelect": "CustomSingleSelect",
        "ui:options": {
          isDisabled,
          label: false,
          isPathBuilderComponent: true,
          InputIcon: ViaIcon,
          onUpdate: async (selectedOption: string, formId: string) => {
            const viaIndex = getConnectionId(formId, statement.vias);
            const typeOption = selectedOption as ViaTypeEnum;

            if (viaIndex) {
              try {
                await api.composerViaPartialUpdate(viaIndex, {
                  type: typeOption,
                });
                refreshStatement()
                dispatch(setWasChangeDetected(true));
                return ChangeRequestStatus.SAVED;
              } catch (error) {
                return checkOwnership(
                  statement.id,
                  async () => {
                    await api.composerViaPartialUpdate(viaIndex, {
                      type: typeOption,
                    });
                    dispatch(setWasChangeDetected(true));
                    refreshStatement()
                    return ChangeRequestStatus.SAVED;
                  },
                  () => {
                    return ChangeRequestStatus.CANCELLED;
                  },
                  (owner) => getOwnershipAlertMessage(owner)
                );
              }
            }
            return ChangeRequestStatus.CANCELLED;
          },
        },
      },
      anatomical_entities: {
        "ui:widget": CustomEntitiesDropdown,
        "ui:options": {
          refreshStatement: refreshStatement,
          isDisabled,
          statement: statement,
          label: "Via",
          fieldName: "vias.anatomical_entities",
          placeholder: "Look for vias",
          searchPlaceholder: "Search for vias",
          noResultReason: "No anatomical entities found",
          disabledReason: "",
          onSearch: async (
            searchValue: string,
            formId: string,
            selectedOptions: Option[],
          ) => {
            return getAnatomicalEntitiesForForm(
              searchValue,
              formId,
              statement,
              ViasGroupLabel,
              "vias",
              "anatomical_entities",
              selectedOptions,
            );
          },
          onUpdate: async (selectedOptions: Option[], formId: any) => {
            return await updateEntity({
              statementId: statement.id,
              selected: selectedOptions,
              entityId: getConnectionId(formId, statement.vias),
              entityType: "via",
              propertyToUpdate: "anatomical_entities",
              dispatch
            });
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
          refreshStatement: refreshStatement,
          isDisabled,
          statement: statement,
          label: "From",
          fieldName: "vias.from_entities",
          postProcessOptions: true,
          placeholder: "Look for connections",
          searchPlaceholder: "Search for connections",
          noResultReason: "No prior connections found",
          disabledReason: "",
          onSearch: async (
            searchValue: string,
            formId: string,
            selectedOptions: Option[],
          ) => {
            return getAnatomicalEntitiesForForm(
              searchValue,
              formId,
              statement,
              ViasGroupLabel,
              "vias",
              "from_entities",
              selectedOptions,
            );
          },
          onUpdate: async (selectedOptions: Option[], formId: any) => {
            return await updateEntity({
              statementId: statement.id,
              selected: selectedOptions,
              entityId: getConnectionId(formId, statement.vias),
              entityType: "via",
              propertyToUpdate: "from_entities",
              dispatch
            });
          },
          areConnectionsExplicit: (formId: any) => {
            const id = getFirstNumberFromString(formId)
            if (id !== null) {
              return statement?.vias[id]?.are_connections_explicit ? statement?.vias[id]?.are_connections_explicit : false;
            }
          },
          getPreLevelSelectedValues: (formId: any) => {
            const id = getFirstNumberFromString(formId)
            let entity: any = []
            if (id !== null) {
              const preLevelItems = id === 0 ? statement['origins'] : statement['vias'][id - 1]['anatomical_entities']
              const selected = findMatchingEntities(
                statement,
                preLevelItems,
              );
              selected.forEach((row: any) => {
                entity.push(
                  mapAnatomicalEntitiesToOptions(
                    [row],
                    getViasGroupLabel(row.order + 1),
                  )[0],
                );
              });
              return entity
            }
          },
          errors: "",
          mapValueToOption: (anatomicalEntities: any[]) => {
            const entities: Option[] = [];
            const selected = findMatchingEntities(
              statement,
              anatomicalEntities,
            );
            selected.forEach((row: any) => {
              entities.push(
                mapAnatomicalEntitiesToOptions(
                  [row],
                  getViasGroupLabel(row.order + 1),
                )[0],
              );
            });
            return entities;
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
        id={statement.id}
        onElementDelete={async (element: any) => {
          await api.composerDestinationDestroy(
            element.children.props.formData.id,
          );
          dispatch(setWasChangeDetected(true));
          refreshStatement();
        }}
        onElementAdd={async () => {
          await api.composerDestinationCreate({
            id: -1,
            connectivity_statement: statement.id,
            type: DestinationTypeEmum.AxonT,
            anatomical_entities: [],
            from_entities: [],
          });
          refreshStatement();
        }}
        hideDeleteBtn={statement?.destinations?.length < 1 || isDisabled}
        showReOrderingIcon={false}
        addButtonPlaceholder={"Destination"}
        canAdd={!isDisabled}
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
          isDisabled,
          label: false,
          isPathBuilderComponent: true,
          InputIcon: DestinationIcon,
          onUpdate: async (selectedOption: string, formId: string) => {
            const destinationIndex = getConnectionId(formId, statement?.destinations);
            const typeOption = selectedOption as DestinationTypeEmum;
            if (destinationIndex) {
              try {
                await api.composerDestinationPartialUpdate(destinationIndex, {
                  type: typeOption,
                })
                dispatch(setWasChangeDetected(true));
                refreshStatement()
                return ChangeRequestStatus.SAVED;
              } catch (error) {
                return checkOwnership(
                  statement.id,
                  async () => {
                    await api.composerDestinationPartialUpdate(destinationIndex, {
                      type: typeOption,
                    })
                    dispatch(setWasChangeDetected(true));
                    refreshStatement()
                    return ChangeRequestStatus.SAVED;
                  },
                  () => {
                    return ChangeRequestStatus.CANCELLED;
                  },
                  (owner) => getOwnershipAlertMessage(owner)
                );
              }
            }
            return ChangeRequestStatus.CANCELLED;
          },
        },
      },
      anatomical_entities: {
        "ui:widget": CustomEntitiesDropdown,
        "ui:options": {
          refreshStatement: refreshStatement,
          isDisabled,
          statement: statement,
          placeholder: "Look for Destinations",
          searchPlaceholder: "Search for Destinations",
          noResultReason: "No anatomical entities found",
          disabledReason: "",
          fieldName: "destinations.anatomical_entities",
          onSearch: async (
            searchValue: string,
            formId: string,
            selectedOptions: Option[],
          ) => {
            return getAnatomicalEntitiesForForm(
              searchValue,
              formId,
              statement,
              DestinationsGroupLabel,
              "destinations",
              "anatomical_entities",
              selectedOptions,
            );
          },
          onUpdate: async (selectedOptions: Option[], formId: string) => {
            return await updateEntity({
              statementId: statement.id,
              selected: selectedOptions,
              entityId: getConnectionId(formId, statement?.destinations),
              entityType: "destination",
              propertyToUpdate: "anatomical_entities",
              dispatch
            });
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
          refreshStatement: refreshStatement,
          isDisabled,
          statement: statement,
          label: "From",
          fieldName: "destinations.from_entities",
          postProcessOptions: true,
          placeholder: "Look for Destinations",
          searchPlaceholder: "Search for Destinations",
          noResultReason: "",
          disabledReason: "",
          onSearch: async (
            searchValue: string,
            formId: string,
            selectedOptions: Option[],
          ) => {
            return getAnatomicalEntitiesForForm(
              searchValue,
              formId,
              statement,
              ViasGroupLabel,
              "destinations",
              "from_entities",
              selectedOptions,
            );
          },
          onUpdate: async (selectedOptions: Option[], formId: string) => {
            return await updateEntity({
              statementId: statement.id,
              selected: selectedOptions,
              entityId: getConnectionId(formId, statement?.destinations),
              entityType: "destination",
              propertyToUpdate: "from_entities",
              dispatch
            });
          },
          areConnectionsExplicit: (formId: any) => {
            const id = getFirstNumberFromString(formId)
            if (id !== null) {
              return statement?.destinations[id]?.are_connections_explicit ? statement?.destinations[id]?.are_connections_explicit : false;
            }
          },
          getPreLevelSelectedValues: (formId: any) => {
            const id = getFirstNumberFromString(formId)
            let entity: any = []
            if (id !== null) {
              const preLevelItems = id === 0 && statement['vias'].length === 0 ? statement['origins'] : statement['vias'][statement?.vias?.length - 1]?.anatomical_entities
              const selected = findMatchingEntities(
                statement,
                preLevelItems,
              );
              selected.forEach((row: any) => {
                entity.push(
                  mapAnatomicalEntitiesToOptions(
                    [row],
                    getViasGroupLabel(row.order + 1),
                  )[0],
                );
              });
              return entity
            }

          },
          errors: "",
          mapValueToOption: (anatomicalEntities: any[]) => {
            const entities: Option[] = [];
            const selected = findMatchingEntities(
              statement,
              anatomicalEntities,
            );
            selected.forEach((row: any) => {
              entities.push(
                mapAnatomicalEntitiesToOptions(
                  [row],
                  getViasGroupLabel(row.order + 1),
                )[0],
              );
            });
            return entities;
          },
          CustomFooter: CustomFooter,
        },
      },
    },
  };

  copiedUISchema.additional_information = {
    "ui:widget": "CustomTextField",
    "ui:options": {
      isDisabled,
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
      refreshStatement: refreshStatement,
      chipsNumber: 10,
      isDisabled,
      placeholder: "Forward connection(s)",
      searchPlaceholder: "Search for Connectivity Statements",
      noResultReason:
        "We couldn't find any record with these origin in the database.",
      disabledReason: statement?.destinations?.length === 0 ?
        "Add Destination entity to get access to the forward connection form" : "",
      fieldName: "forward_connection",
      postProcessOptions: true,
      onSearch: async (searchValue: string) => {
        const selectedForwardConnection = statement?.forward_connection?.map(
          (origin: Option) => origin.id,
        );

        const excludedIds = searchValue ? [] : selectedForwardConnection;
        return searchForwardConnection(searchValue, statement, excludedIds);
      },
      onUpdate: async (selectedOptions: Option[]) => {
        return await updateForwardConnections(selectedOptions, statement, dispatch);
      },
      statement: statement,
      errors: statement?.errors?.includes("Invalid forward connection")
        ? "Forward connection(s) not found"
        : "",
      mapValueToOption: (connectivityStatements: ConnectivityStatement[]) =>
        createOptionsFromStatements(
          connectivityStatements,
          statement.sentence_id,
        ),
      header: {
        label: "Origins",
        values:
          statement?.destinations &&
          Array.from(
            new Set(
              statement?.destinations.flatMap((item: any) =>
                item.anatomical_entities.map((entity: any) => entity.name),
              ),
            ),
          ),
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
            window.open(window.location.origin + "/statement/" + entity?.id, '_blank')
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

  // Set custom label and widget for each field in statement_triples
  if (!copiedUISchema.statement_triples) copiedUISchema.statement_triples = {};
  Object.entries(copiedSchema.properties.statement_triples.properties).forEach(([key, prop]) => {
    const property = prop as { type?: string | string[]; title?: string };
    property.title = "";
  })

  // Add null option to the fields which have null type in dropdown.
  Object.keys(copiedSchema.properties).forEach((key) => {
    const property = copiedSchema.properties[key];

    // Check if the 'type' exists and is an array or string that includes 'null'
    if (property.type && Array.isArray(property.type) && property.type.includes("null")) {
      // Check if 'enum' and 'enumNames' exist
      if (property.enum && property.enumNames) {
        property.enum.push(null);
        property.enumNames.push("---------");
      }
    }
  });

  Object.keys(copiedUISchema).forEach((key) => {
    if (copiedUISchema[key]["ui:options"] && copiedUISchema[key]["ui:options"].data) {
      copiedUISchema[key]["ui:options"].data.push({ label: "---------", value: null })
    }
  });


  const widgets = {
    AnatomicalEntitiesField,
    CustomSingleSelect,
    CustomTextField,
    CustomTextArea,
    SelectWidget: CustomSingleSelect,
    AutocompleteWithChips
  };



  useEffect(() => {
    statementService.getRelationshipOptions().then((response: any) => {
      setRelationshipOptions(response.results);
    });
  }, []);


  return (
    <FormBase
      data={statement}
      service={statementService}
      onSaveCancel={refreshStatement}
      schema={copiedSchema}
      uiSchema={copiedUISchema}
      uiFields={uiFields}
      enableAutoSave={false}
      widgets={widgets}
      showErrorList={false}
      disabled={isDisabled}
      submitOnBlurFields={[
        "knowledge_statement",
        "additional_information",
        "apinatomy_model",
        "curie_id",
      ]}
      submitOnChangeFields={[
        "phenotype_id",
        "sex_id",
        "population_id",
        "laterality",
        "circuit_type",
        "projection",
        "projection_phenotype_id",
      ]}
      {...props}
    />
  );
});

export default StatementForm;
