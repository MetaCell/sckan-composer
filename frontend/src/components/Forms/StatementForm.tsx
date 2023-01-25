import React from 'react'
import validator from "@rjsf/validator-ajv8";
import { UiSchema } from "@rjsf/utils";
import {IChangeEvent, withTheme} from "@rjsf/core";
import { Box} from '@mui/material';
import { Theme } from '@rjsf/mui'
import { hiddenWidget } from '../../helpers/helpers';

const Form = withTheme(Theme);

const schema = require("../../schemas/ConnectivityStatement.json")

const StatementForm = (props:any) => {

    const {formData, excludedFields} = props
    const hiddenFields = ['owner', 'id', 'modified_date', 'sentence', ...excludedFields]

    const uiSchema: UiSchema = {
        "ui:submitButtonOptions": {
            "norender": true,
        },
        ...hiddenWidget(hiddenFields),
        "ui:order":['knowledge_statement', 'species', 'biological_sex', 'apinatomy_model', 'circuit_type', 'laterality', 'ans_division', ...hiddenFields]
    };
    const handleSubmit = async (event: IChangeEvent) => {
        console.log(event.formData)
    };

    return (
    <Box p={2}>
        <Form
            schema={schema}
            uiSchema={uiSchema}
            formData={formData}
            validator={validator}
            onSubmit={handleSubmit}
        />
    </Box>
    )
}

export default StatementForm