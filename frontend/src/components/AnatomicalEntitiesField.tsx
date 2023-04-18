import React from "react";
import AutoComplete from "./AutoComplete";
import { AnatomicalEntity } from "../apiclient/backend";
import { composerApi as api } from "../services/apis";
import { duplicatesSelectRowsPerPage } from "../helpers/settings";

function AnatomicalEntitiesField(props: any) {
  const { label } = props.options;
  const placeholder = "Select " + props.label?.slice(0, -3);

  const [entity, setEntity] = React.useState<AnatomicalEntity>();
  const [loading, setLoading] = React.useState(true)

  const fetchEntity = () => api.composerAnatomicalEntityRetrieve(props.value);

  const autoCompleteNoOptionsText = "No entities found";

  React.useEffect(() => {
    props.value ? fetchEntity().then((res) => setEntity(res.data)).finally(()=>setLoading(false)) : setLoading(false)
  }, []);

  const autoCompleteFetch = (inputValue: string) =>
    api.composerAnatomicalEntityList(
      duplicatesSelectRowsPerPage,
      inputValue,
      0
    );

  let inputValue;
  !props.value ? (inputValue = "") : (inputValue = entity?.name);

  if (loading){
    return <div>Loading...</div>
  }

  return (
    <>
        <AutoComplete
          disabled={props.disabled}
          onChange={(newValue: AnatomicalEntity) =>
            props.onChange(newValue?.id)
          }
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
    </>
  );
}

export default AnatomicalEntitiesField;
