import React from 'react'
import validator from "@rjsf/validator-ajv8";
import { UiSchema } from "@rjsf/utils";
import {IChangeEvent, withTheme} from "@rjsf/core";
import { Box} from '@mui/material';
import { Theme } from '@rjsf/mui'
import { hiddenWidget } from '../../helpers/helpers';

const Form = withTheme(Theme);

const schema = require("../../schemas/ConnectivityStatementWithDetails.json")

const excludedFields = ['owner']

const uiSchema: UiSchema = {
    "ui:submitButtonOptions": {
        "norender": true,
      },
    ...hiddenWidget(excludedFields),
};

const StatementForm = (props:any) => {
    const handleSubmit = async (event: IChangeEvent) => {
        console.log(event.formData)
    };

    return (
    <Box p={2}>
        <Form
            schema={schema}
            uiSchema={uiSchema}
            formData={props.formData}
            validator={validator}
            onSubmit={handleSubmit}
        />
    </Box>
    )
}

export default StatementForm