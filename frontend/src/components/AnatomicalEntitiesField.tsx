import React, {useCallback} from "react";
import AutoComplete from "./AutoComplete";
import {AnatomicalEntity} from "../apiclient/backend";
import {composerApi as api} from "../services/apis";
import {autocompleteRows} from "../helpers/settings";
import theme from "../theme/Theme";
import Typography from "@mui/material/Typography";

function AnatomicalEntitiesField(props: any) {
  const {label, errors, isDisabled} = props.options;
  const placeholder = "Select " + props.label?.slice(0, -3);

  const [entity, setEntity] = React.useState<AnatomicalEntity>();
  const [loading, setLoading] = React.useState(true);

  const fetchEntity = useCallback(() => {
    return api.composerAnatomicalEntityRetrieve(props.value);
  }, [props.value]);

  const autoCompleteNoOptionsText = "No entities found";

  React.useEffect(() => {
    props.value
      ? fetchEntity()
        .then((res) => setEntity(res.data))
        .finally(() => setLoading(false))
      : setLoading(false);
  }, [fetchEntity, props.value]);

  const autoCompleteFetch = (inputValue: string) =>
    api.composerAnatomicalEntityList([], autocompleteRows, inputValue, 0);

  let inputValue;
  !props.value ? (inputValue = "") : (inputValue = entity?.name);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <AutoComplete
        borderColor={
          errors?.length !== 0 ? theme.palette.error.main : "#EAECF0"
        }
        disabled={isDisabled}
        onChange={(newValue: AnatomicalEntity) => props.onChange(newValue?.id)}
        placeholder={
          props.label === "Anatomical entity id" ? "Select Via" : placeholder
        }
        noOptionsText={autoCompleteNoOptionsText}
        setValue={(value: AnatomicalEntity) => {
          setEntity(value);
        }}
        value={inputValue}
        fetch={autoCompleteFetch}
        label={label}
      />
      {errors?.length !== 0 && (
        <Typography color={theme.palette.error.main} mt={1}>
          {errors}
        </Typography>
      )}
    </>
  );
}

export default AnatomicalEntitiesField;
