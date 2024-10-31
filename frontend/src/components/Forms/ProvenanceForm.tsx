import React from "react";
import { FormBase } from './FormBase'
import { jsonSchemas } from '../../services/JsonSchema'
import provenanceService from '../../services/ProvenanceService'
import {Provenance} from "../../apiclient/backend";
import TextfieldWithChips from "../Widgets/TextfieldWithChips";
import {checkOwnership, getOwnershipAlertMessage} from "../../helpers/ownershipAlert";
import {ChangeRequestStatus} from "../../helpers/settings";

const ProvenancesForm = (props: any) => {
  const { provenancesData, setter, extraData, isDisabled } = props

  const { schema, uiSchema } = jsonSchemas.getProvenanceSchema()
  const copiedSchema = JSON.parse(JSON.stringify(schema));
  const copiedUISchema = JSON.parse(JSON.stringify(uiSchema));

  const refresh = () => {
    setter()
  }

  // TODO: set up the widgets for the schema
  copiedSchema.title = ""

  const handleAutocompleteChange = (e:any, value:any)=>{
    const newValue = value.pop()
    return checkOwnership(
      extraData.connectivity_statement_id,
      async () => {
        provenanceService.save({statementId: extraData.connectivity_statement_id, uri: newValue}).then(()=>{
          setter()
        })
      },
      () => {
        return ChangeRequestStatus.CANCELLED;
        },
      getOwnershipAlertMessage // message to show when ownership needs to be reassigned
    );
  }

  const isValidUrl = (uri: string) =>{
    var urlPattern = new RegExp('^(https?:\\/\\/)?'+ 
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ 
    '((\\d{1,3}\\.){3}\\d{1,3}))'+ 
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ 
    '(\\?[;&a-z\\d%_.~+=-]*)?'+ 
    '(\\#[-a-z\\d_]*)?$','i')
    if (!uri.match(urlPattern)) return false
    return true
  }

  copiedUISchema.uri = {
    "ui:widget": TextfieldWithChips,
    "ui:options": {
      isDisabled: !extraData.connectivity_statement_id || isDisabled,
      data: provenancesData?.map((row: Provenance) => ({id: row.id, label: row.uri, enableClick: isValidUrl(row.uri) })) || [],
      placeholder: isDisabled ? null : 'Enter Provenances (Press Enter to add a Provenance)',
      removeChip: function(provenanceId: any) {
        return checkOwnership(
          extraData.connectivity_statement_id,
          async () => {
           await provenanceService.delete(provenanceId, extraData.connectivity_statement_id)
            refresh()
          },
          () => {
            return ChangeRequestStatus.CANCELLED;
            },
          getOwnershipAlertMessage // message to show when ownership needs to be reassigned
        );
       
      },
      onAutocompleteChange: handleAutocompleteChange,
    }
  }
  copiedUISchema.connectivity_statement_id = {
    "ui:widget": 'hidden',
  }

  copiedSchema.properties.connectivity_statement_id = {
    ...copiedSchema.properties.connectivity_statement_id,
    default: extraData.connectivity_statement_id
  }

  return (
      <FormBase
        {...props}
        service={provenanceService}
        data={provenancesData}
        schema={copiedSchema}
        uiSchema={copiedUISchema}
        enableAutoSave={false}
        clearOnSave={true}
        children={true}
        extraData={extraData}
        setter={() => refresh()}
        disabled={isDisabled}
      />
  )
}

export default ProvenancesForm
