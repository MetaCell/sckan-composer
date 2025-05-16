import React, { useState } from "react";
import { FormBase } from "./FormBase";
import { jsonSchemas } from "../../services/JsonSchema";
import noteService from "../../services/NoteService";
import { UiSchema } from "@rjsf/utils";
import CustomTextArea from "../Widgets/CustomTextArea";
import SendIcon from "@mui/icons-material/Send";
import { vars } from "../../theme/variables";


const NoteForm = (props: any) => {
  const { setRefresh, extraData } = props;
  const { schema, uiSchema } = jsonSchemas.getNoteSchema();
  const [data, setData] = useState({});

  const clearNoteForm = () => {
    setData({});
    setRefresh(true);
  };
  // TODO: set up the widgets for the schema
  const uiFields = ["note"];
  const customSchema = {
    ...schema,
    title: "",
  };

  const customUiSchema: UiSchema = {
    ...uiSchema,
    note: {
      "ui:widget": CustomTextArea,
      "ui:options": {
        placeholder: "Write your note",
        rows: 5,
      },
    },
  };

  const submitButtonProps = {
    sx: {
      padding: 0,
      color: vars.darkBlue,
      "&:hover": {
        background: "transparent",
        color: vars.mediumBlue,
      },
    },
    className: "btn btn-primary",
    startIcon: <SendIcon />,
    label: "Send",
  };

  return (
    <FormBase
      data={data}
      service={noteService}
      schema={customSchema}
      uiSchema={customUiSchema}
      uiFields={uiFields}
      enableAutoSave={false}
      clearOnSave={true}
      setter={clearNoteForm}
      extraData={extraData}
      submitButtonProps={submitButtonProps}
      {...props}
    />
  );
};

export default NoteForm;
