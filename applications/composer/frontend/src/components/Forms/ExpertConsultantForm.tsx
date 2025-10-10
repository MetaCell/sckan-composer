import React, {useState} from "react";
import { FormBase } from './FormBase'
import { jsonSchemas } from '../../services/JsonSchema'
import expertConsultantService from '../../services/ExpertConsultantService'
import TextfieldWithChips from "../Widgets/TextfieldWithChips";
import {checkOwnership, getOwnershipAlertMessage} from "../../helpers/ownershipAlert";
import {ChangeRequestStatus} from "../../helpers/settings";
import {isValidURI, isValidUrl, getURIValidationErrorMessage} from "../../helpers/uriValidation";

// Temporary type until API client is regenerated
interface ExpertConsultant {
  id: number;
  uri: string;
  connectivity_statement_id: number;
}

const ExpertConsultantsForm = (props: any) => {
  const { expertConsultantsData, setter, extraData, isDisabled } = props
  const [isLoading, setIsLoading] = useState(false)

  const { schema, uiSchema } = jsonSchemas.getExpertConsultantsSchema()
  const copiedSchema = JSON.parse(JSON.stringify(schema));
  const copiedUISchema = JSON.parse(JSON.stringify(uiSchema));

  const refresh = () => {
    setter()
  }

  copiedSchema.title = ""

  const handleAutocompleteChange = (e:any, value:any)=>{
    const newValue = value.pop()
    
    // Validate the URI format before saving
    if (!isValidURI(newValue)) {
      alert(getURIValidationErrorMessage("expert consultant URI"));
      return;
    }
    
    setIsLoading(true)
    return checkOwnership(
      extraData.connectivity_statement_id,
      async () => {
        expertConsultantService.save({statementId: extraData.connectivity_statement_id, uri: newValue}).then(()=>{
          setter()
        }).catch((error) => {
          // Handle backend validation errors
          if (error.response && error.response.data && error.response.data.uri) {
            alert(`Validation error: ${error.response.data.uri[0]}`);
          } else {
            alert('Failed to save expert consultant. Please try again.');
          }
        }).finally(() => {
          setIsLoading(false)
        })
      },
      () => {
        setIsLoading(false)
        return ChangeRequestStatus.CANCELLED;
        },
      getOwnershipAlertMessage // message to show when ownership needs to be reassigned
    );
  }

  copiedUISchema.uri = {
    "ui:widget": TextfieldWithChips,
    "ui:options": {
      isDisabled: !extraData.connectivity_statement_id || isDisabled,
      data: expertConsultantsData?.map((row: ExpertConsultant) => ({id: row.id, label: row.uri, enableClick: isValidUrl(row.uri) })) || [],
      placeholder: isDisabled ? null : 'Enter Expert Consultant URIs (Press Enter to add)',
      removeChip: function(expertConsultantId: any) {
        setIsLoading(true)
        return checkOwnership(
          extraData.connectivity_statement_id,
          async () => {
           await expertConsultantService.delete(expertConsultantId, extraData.connectivity_statement_id)
            refresh()
            setIsLoading(false)
          },
          () => {
            setIsLoading(false)
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
        service={expertConsultantService}
        data={expertConsultantsData}
        schema={copiedSchema}
        uiSchema={copiedUISchema}
        enableAutoSave={false}
        clearOnSave={true}
        children={true}
        extraData={extraData}
        setter={() => refresh()}
        disabled={isDisabled}
        isLoading={isLoading}
      />
  )
}

export default ExpertConsultantsForm
