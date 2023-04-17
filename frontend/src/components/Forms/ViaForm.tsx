import React from "react";
import { jsonSchemas } from "../../services/JsonSchema";
import { FormBase } from "./FormBase";

const ViaForm = (props: any) => {
  const { via } = props;
  const { schema, uiSchema } = jsonSchemas.getViaSchema();

  return (
    <FormBase
      {...props}
      data={via}
      //service={viaService}
      schema={schema}
      uiSchema={uiSchema}
      //uiFields={uiFields}
      enableAutoSave={true}
      children={true}
    />
  );
};

export default ViaForm;
