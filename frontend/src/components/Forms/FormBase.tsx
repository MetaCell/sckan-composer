import React, { useRef, useState, useEffect } from "react";
import validator from "@rjsf/validator-ajv8";
import { IChangeEvent, withTheme } from "@rjsf/core";
import { Backdrop, Box, CircularProgress } from "@mui/material";
import { Theme } from "@rjsf/mui";
import { useDebouncedCallback } from "use-debounce";
import { EDIT_DEBOUNCE } from "../../settings";
import Button from "@mui/material/Button";

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
    children = false,
    widgets,
    submitButtonProps,
  } = props;
  const [localData, setLocalData] = useState<any>(data);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const triggerAutoSave = useDebouncedCallback(() => onSave(), EDIT_DEBOUNCE);
  const [isSubmitButtonDisabled, setIsSubmitButtonDisabled] =
    useState<boolean>(false);
  const [customSchema, setCustomSchema] = useState<any>(schema);
  const [customUiSchema, setCustomUiSchema] = useState<any>(uiSchema);

  const submitButtonRef = useRef<any>(null);
  const removeProp = (obj: any, prop: string) => {
    const { [prop]: removedProp, ...newObj } = obj;
    return newObj;
  };

  //add side effect to modify local state instead of deleting props from schema
  //as it was mutating the original object at the jsonschema singleton

  useEffect(() => {
    setLocalData(data);
    setCustomSchema(schema);
    setCustomUiSchema(uiSchema);
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
  }, [data]);

  const onError = (errors: any) => {
    log("errors");
    log(errors);
  };

  const onSave = () => {
    if (submitButtonRef.current != null) {
      return submitButtonRef.current.click();
    }
  };

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
      setIsSubmitButtonDisabled(true);
    } else {
      setIsSubmitButtonDisabled(false);
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
          schema={customSchema}
          uiSchema={customUiSchema}
          formData={localData}
          disabled={disabled}
          validator={validator}
          onChange={handleUpdate}
          onSubmit={handleSubmit}
          onError={onError}
          widgets={widgets}
        >
          {children}

          <Button
            ref={submitButtonRef}
            type="submit"
            disabled={isSubmitButtonDisabled}
            sx={{
              display: (enableAutoSave || !submitButtonProps) && "none",
            }}
            {...submitButtonProps}
          >
            {submitButtonProps?.label ? submitButtonProps.label : "Submit"}
          </Button>
        </Form>
      </Box>
    </>
  );
};
