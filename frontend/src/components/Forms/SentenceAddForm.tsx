import React from "react";
import { Box, Button } from "@mui/material";
import { FormBase } from "./FormBase";
import { jsonSchemas } from "../../services/JsonSchema";
import sentenceService from "../../services/SentenceService";
import { UiSchema } from "@rjsf/utils";
import CustomTextField from "../Widgets/CustomTextField";

const SentenceAddForm = (props: any) => {
  const { format } = props;
  const { schema, uiSchema } = jsonSchemas.getSentenceSchema();

  const [disabled, setDisabled] = React.useState(true)

  const uiFields =
    format === "small"
      ? ["title"]
      : format === "create"
      ? ["title", "pmid", "pmcid", "doi", "text"]
      : undefined;

  const uiOrder = format === "create" ? ["*", "text"] : undefined;
  // TODO: set up the widgets for the schema

  const customSchema = format === "create" ? { ...schema, title: "" } : schema;

  const formIsValid = (formData: any) => {
    const { pmid, pmcid, doi, title, text } = formData;
    if ((pmid || pmcid || doi) && title && text) {
      return true;
    }
    return false;
  };

  const customUiSchema: UiSchema = {
    ...uiSchema,
    title: {
      "ui:widget": CustomTextField,
      "ui:options": {
        label: "Article Title",
        placeholder: "Enter Article Title",
      },
    },
    text: {
      "ui:widget": CustomTextField,
      "ui:options": {
        rows: 5,
        multiline: true,
        label: "Sentence",
        placeholder: "Enter the sentence",
      },
    },
    pmid: {
      "ui:widget": CustomTextField,
      "ui:options": {
        label: "PMID",
        placeholder: "Enter PMID",
      },
    },
    pmcid: {
      "ui:widget": CustomTextField,
      "ui:options": {
        label: "PMCID",
        placeholder: "Enter PMCID",
      },
    },
    doi: {
      "ui:widget": CustomTextField,
      "ui:options": {
        label: "DOI",
        placeholder: "Enter DOI",
      },
    },
    "ui:order": uiOrder,
  };
  return (
    <Box>
      <FormBase
        service={sentenceService}
        schema={customSchema}
        uiSchema={customUiSchema}
        uiFields={uiFields}
        enableAutoSave={true}
        formIsValid={format === "create" && formIsValid}
        disableSubmitButton={setDisabled}
        {...props}
      >
        <Button type='submit' variant='contained' fullWidth disabled={disabled}>Done</Button>
      </FormBase>
    </Box>
  );
};

export default SentenceAddForm;
