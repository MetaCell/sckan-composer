import React, { useRef, useState, useEffect } from "react";
import validator from "@rjsf/validator-ajv8";
import { IChangeEvent, withTheme } from "@rjsf/core";
import { Backdrop, Box, CircularProgress } from "@mui/material";
import { Theme } from "@rjsf/mui";
import { useDebouncedCallback } from "use-debounce";
import { EDIT_DEBOUNCE } from "../../settings";
import { isEqual } from "../../helpers/helpers";

const Form = withTheme(Theme);

const log = (type: string) => console.log.bind(console, type);

export const FormBase = (props: any) => {
  const {
    service,
    data,
    schema,
    setter,
    extraData,
    uiSchema,
    uiFields,
    enableAutoSave,
    disabled = false,
    clearOnSave = false,
    action,
    formIsValid,
    sx,
    children = false,
    widgets,
    isUpdate
  } = props;
  const [localData, setLocalData] = useState<any>(data);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const triggerAutoSave = useDebouncedCallback(() => onSave(), EDIT_DEBOUNCE);
  const [customSchema, setCustomSchema] = useState<any>(schema);
  const [customUiSchema, setCustomUiSchema] = useState<any>(uiSchema);

  const formRef = useRef<any>(null);

  const removeProp = (obj: any, prop: string) => {
    const { [prop]: removedProp, ...newObj } = obj;
    return newObj;
  };

  //add side effect to modify local state instead of deleting props from schema
  //as it was mutating the original object at the jsonschema singleton

  useEffect(() => {
    if (uiFields) {
      Object.entries(uiSchema).forEach((p) => {
        if (!p[0].startsWith("ui:") && !uiFields.includes(p[0])) {
          setCustomSchema((customSchema: any) => ({
            ...customSchema,
            properties: removeProp(customSchema.properties, p[0]),
          }));
          setCustomUiSchema((customUiSchema: any) =>
            removeProp(customUiSchema, p[0])
          );
        }
      });
    }
  }, []);

  const onError = (errors: any) => {
    log("errors");
    log(errors);
  };

  const onSave = () => {
    if (formRef.current != null) {
      return formRef.current.submit();
    }
  };

  const toggleSubmitButton = (disable: boolean) => {
    setCustomUiSchema({
      ...customUiSchema,
      "ui:submitButtonOptions": {
        ...customUiSchema["ui:submitButtonOptions"],
        props: {
          ...customUiSchema["ui:submitButtonOptions"]?.props,
          disabled: disable,
        },
      },
    });
  };

  const enableSubmitButton = () => toggleSubmitButton(false);
  const disableSubmitButton = () => toggleSubmitButton(true);

  const handleSubmit = async (event: IChangeEvent) => {
    const formData = { ...event.formData, ...extraData };
    setIsSaving(true);
    setLocalData(formData);
    service
      .save(formData)
      .then((newData: any) => {
        setter && setter(newData);
        // todo: improve UI feedback
        if (action) {
          action(newData);
        }
        log("Saved");
      })
      .catch((error: any) => {
        // todo: handle errors here
        log("Something went wrong");
      })
      .finally(() => {
        setIsSaving(false);
        if (clearOnSave) {
          setLocalData({});
        }
      });
  };

  const handleUpdate = async (event: IChangeEvent) => {
    const formData = { ...event.formData, ...extraData };
    setLocalData(formData);
    if (formIsValid && !formIsValid(formData)) {
      disableSubmitButton();
    } else {
      enableSubmitButton();
      if (enableAutoSave) {
        return triggerAutoSave();
      }
    }
  };

  return (
    <>
      {(!data || isSaving) && (
        <Backdrop open={isSaving}>
          <CircularProgress color="inherit" />
        </Backdrop>
      )}
      <Box>
        <Form
          ref={formRef}
          schema={customSchema}
          uiSchema={customUiSchema}
          formData={localData}
          disabled={disabled}
          validator={validator}
          onChange={handleUpdate}
          onSubmit={handleSubmit}
          onError={onError}
          children={children}
          widgets={widgets}
        />
      </Box>
    </>
  );
};
