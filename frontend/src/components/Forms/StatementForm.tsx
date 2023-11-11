import React from "react";
import {FormBase} from "./FormBase";
import {jsonSchemas} from "../../services/JsonSchema";
import statementService from "../../services/StatementService";
import CustomTextField from "../Widgets/CustomTextField";
import CustomSingleSelect from "../Widgets/CustomSingleSelect";
import CustomTextArea from "../Widgets/CustomTextArea";
import ArrayFieldTemplate from "../Widgets/ArrayFieldTemplate";
import AnatomicalEntitiesField from "../AnatomicalEntitiesField";
import {sexes} from "../../services/SexService";
import {phenotypes} from "../../services/PhenotypeService";
import {CustomAutocompleteForwardConnection} from "../Widgets/CustomAutocompleteForwardConnection";
import {Box, Chip} from "@mui/material";
import CustomEntitiesDropdown from "../Widgets/CustomEntitiesDropdown";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import {
    getAnatomicalEntities,
    getConnectionId,
    searchFromEntitiesDestination,
    searchFromEntitiesVia,
    updateEntity,
    updateOrigins,
} from "../../services/CustomDropdownService";
import {mapAnatomicalEntitiesToOptions} from "../../helpers/dropdownMappers";
import {DestinationIcon, ViaIcon} from "../icons";
import {DestinationsGroupLabel, OriginsGroupLabel, ViasGroupLabel} from "../../helpers/settings";
import {Option} from "../../types";

const StatementForm = (props: any) => {
    const {uiFields, statement, refreshStatement} = props;
    const {schema, uiSchema} = jsonSchemas.getConnectivityStatementSchema();
    const copiedSchema = JSON.parse(JSON.stringify(schema));
    const copiedUISchema = JSON.parse(JSON.stringify(uiSchema));
    // TODO: set up the widgets for the schema
    copiedSchema.title = "";
    copiedSchema.properties.destinations.title = "";
    copiedSchema.properties.destinations.name = "Destination";
    copiedSchema.properties.vias.name = "Via";

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
                .map((row: any) => ({label: row.name, value: row.id})),
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
                .map((row: any) => ({label: row.name, value: row.id})),
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

    copiedUISchema.origins = {
        "ui:widget": CustomEntitiesDropdown,
        "ui:options": {
            statement: statement,
            placeholder: "Origin",
            searchPlaceholder: "Search for Origins",
            noResultReason: "No results found",
            disabledReason: "",
            chipsNumber: 5,
            onSearch: async (searchValue: string, formId: string) => getAnatomicalEntities(searchValue, OriginsGroupLabel),
            onUpdate: async (selectedOptions: any) => {
                await updateOrigins(selectedOptions, statement.id)
                refreshStatement()
            },
            errors: "",
            mapValueToOption: () => mapAnatomicalEntitiesToOptions(statement?.origins, OriginsGroupLabel),
        },
    };

    // TODO: check how to treat from entities with the same id from different layers @ afonsobspinto
    // TODO: Fix custom header @ afonsobspinto

    copiedUISchema.vias = {
        "ui:ArrayFieldTemplate": ArrayFieldTemplate,
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
                    onSearch: async (searchValue: string, formId: string) => getAnatomicalEntities(searchValue, ViasGroupLabel),
                    onUpdate: async (selectedOptions: Option[], formId: any) => {
                        await updateEntity({
                            selected: selectedOptions,
                            entityId: getConnectionId(formId, statement.vias),
                            entityType: 'via',
                            propertyToUpdate: 'anatomical_entities'
                        });
                        refreshStatement()
                    },
                    errors: "",
                    mapValueToOption: (anatomicalEntities: any[]) => mapAnatomicalEntitiesToOptions(anatomicalEntities, ViasGroupLabel),
                    CustomFooter: ({entity}: any) => (
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
                            <Chip variant="outlined" label={"https://google.com"}/>
                        </Box>
                    ),
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
                    onSearch: async (searchValue: string, formId:string) => searchFromEntitiesVia(searchValue, statement, formId),
                    onUpdate: async (selectedOptions: Option[], formId: any) => {
                        await updateEntity({
                            selected: selectedOptions,
                            entityId: getConnectionId(formId, statement.vias),
                            entityType: 'via',
                            propertyToUpdate: 'from_entities'
                        });
                        refreshStatement()
                    },
                    errors: "",
                    mapValueToOption: (anatomicalEntities: any[]) => mapAnatomicalEntitiesToOptions(anatomicalEntities, ViasGroupLabel),
                    CustomFooter: ({entity}: any) => (
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
                            <Chip variant="outlined" label={"https://google.com"}/>
                        </Box>
                    ),
                },
            },
        },
    };


    copiedUISchema.destinations = {
        "ui:ArrayFieldTemplate": ArrayFieldTemplate,
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
                    onSearch: async (searchValue: string) => getAnatomicalEntities(searchValue, DestinationsGroupLabel),
                    onUpdate: async (selectedOptions: Option[], formId: string) =>{
                        await updateEntity({
                            selected: selectedOptions,
                            entityId: getConnectionId(formId, statement.vias),
                            entityType: 'destination',
                            propertyToUpdate: 'anatomical_entities'
                        });
                        refreshStatement()
                    },
                    errors: "",
                    mapValueToOption: (anatomicalEntities: any[]) => mapAnatomicalEntitiesToOptions(anatomicalEntities, DestinationsGroupLabel),
                    CustomFooter: ({entity}: any) => (
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
                            <Chip variant="outlined" label={"https://google.com"}/>
                        </Box>
                    ),
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
                    onSearch: async (searchValue: string, formId: string) => searchFromEntitiesDestination(searchValue, statement),
                    onUpdate: async (selectedOptions: Option[], formId: string) => {
                        await updateEntity({
                            selected: selectedOptions,
                            entityId: getConnectionId(formId, statement.destinations),
                            entityType: 'destination',
                            propertyToUpdate: 'from_entities'
                        });
                        refreshStatement()
                    },
                    errors: "",
                    mapValueToOption: (anatomicalEntities: any[]) => mapAnatomicalEntitiesToOptions(anatomicalEntities, DestinationsGroupLabel),
                    CustomFooter: ({entity}: any) => (
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
                            <Chip variant="outlined" label={"https://google.com"}/>
                        </Box>
                    ),
                },
            }
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
            isFormDisabled: () => statement.destinations.length === 0,
            placeholder: "Forward connection(s)",
            searchPlaceholder: "Search for Knowledge Statements",
            noResultReason:
                "We couldn’t find any record with these origin in the database.",
            disabledReason:
                "Add Destination entity to get access to the forward connection form",
            onSearch: async (searchValue: string) => [],
            onUpdate: async (selectedOptions: Option[]) => {
            },
            statement: statement,
            errors: statement?.errors?.includes("Invalid forward connection")
                ? statement.errors
                : "",
            mapValueToOption: () => statement.forward_connection,
            header: {
                label: "Origins",
                values: [
                    "Major pelvic ganglion",
                    "Prevertebral sympathetic ganglion in abdominal aortic plexus",
                    "Accessory pelvic ganglion",
                ],
            },
            CustomInputChip: ({entity, sx = {}}: any) => (
                <Chip
                    key={entity?.id}
                    variant={"filled"}
                    onClick={(e) => {
                        e.stopPropagation();
                    }}
                    deleteIcon={<OpenInNewIcon sx={{fill: "#548CE5"}}/>}
                    onDelete={(e) => {
                        e.stopPropagation();
                    }}
                    label={entity?.label}
                    sx={{...sx}}
                />
            ),
            CustomHeader: ({entity}: any) => (
                <Box
                    sx={{
                        mb: "1.5rem",
                        pb: "1.5rem",
                        borderBottom: "0.0625rem solid #F2F4F7",
                    }}
                >
                    <Chip variant="outlined" label={"https://google.com"}/>
                </Box>
            ),
            CustomFooter: ({entity}: any) => (
                <Box
                    sx={{
                        mt: "1.5rem",
                        pt: "1.5rem",
                        borderTop: "0.0625rem solid #F2F4F7",
                    }}
                >
                    <Chip variant="filled" color="success" label={"https://google.com"}/>
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
                "vias",
                "origins",
            ]}
            {...props}
        />
    );
};

export default StatementForm;
