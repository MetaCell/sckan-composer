import React from "react";
import { FormBase } from "./FormBase";
import { jsonSchemas } from "../../services/JsonSchema";
import statementService from "../../services/StatementService";
import StatementPreviewWidget from "../StatementPreviewWidget";

const StatementPreviewForm = (props: any) => {
    const { statement } = props;
    const { schema, uiSchema } = jsonSchemas.getConnectivityStatementSchema();
    const copiedSchema = JSON.parse(JSON.stringify(schema));
    const copiedUISchema = JSON.parse(JSON.stringify(uiSchema));

    // Set up the schema for statement preview
    copiedSchema.title = "";
    copiedSchema.properties = {
        statement_preview: {
            type: "string",
            title: "Statement Preview",
            readOnly: true
        }
    };

    copiedUISchema["ui:order"] = ["statement_preview"];
    copiedUISchema.statement_preview = {
        "ui:widget": StatementPreviewWidget,
        "ui:option": {
            statement: statement,
        }
    };

    const widgets = {
        StatementPreviewWidget
    };

    return (
        <FormBase
            data={statement}
            service={statementService}
            schema={copiedSchema}
            uiSchema={copiedUISchema}
            enableAutoSave={false}
            children={true}
            widgets={widgets}
            showErrorList={false}
            {...props}
        />
    );
};

export default StatementPreviewForm;
