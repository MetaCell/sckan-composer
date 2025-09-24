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
    
    // Validate the URI format before saving
    if (!isValidProvenance(newValue)) {
      alert(
        "Invalid provenance format. Please enter a valid:\n" +
        "• DOI (e.g., '10.1000/xyz123' or 'https://doi.org/10.1000/xyz123')\n" +
        "• PMID (e.g., 'PMID:12345678' or 'https://pubmed.ncbi.nlm.nih.gov/12345678')\n" +
        "• PMCID (e.g., 'PMC1234567' or 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC1234567')\n" +
        "• URL (e.g., 'https://example.com')"
      );
      return;
    }
    
    return checkOwnership(
      extraData.connectivity_statement_id,
      async () => {
        provenanceService.save({statementId: extraData.connectivity_statement_id, uri: newValue}).then(()=>{
          setter()
        }).catch((error) => {
          // Handle backend validation errors
          if (error.response && error.response.data && error.response.data.uri) {
            alert(`Validation error: ${error.response.data.uri[0]}`);
          } else {
            alert('Failed to save provenance. Please try again.');
          }
        })
      },
      () => {
        return ChangeRequestStatus.CANCELLED;
        },
      getOwnershipAlertMessage // message to show when ownership needs to be reassigned
    );
  }

  const isValidProvenance = (uri: string) => {
    if (!uri || !uri.trim()) {
      return false;
    }
    
    const trimmedUri = uri.trim();
    
    // DOI patterns
    const doiPatterns = [
      /^10\.\d{4,}\/[^\s]+$/,  // Standard DOI format
      /^doi:10\.\d{4,}\/[^\s]+$/i,  // DOI with prefix
      /^https?:\/\/doi\.org\/10\.\d{4,}\/[^\s]+$/i,  // DOI URL
      /^https?:\/\/dx\.doi\.org\/10\.\d{4,}\/[^\s]+$/i,  // Alternative DOI URL
    ];
    
    // PMID patterns
    const pmidPatterns = [
      /^PMID:\s*\d+$/i,  // PMID with prefix
      /^https?:\/\/pubmed\.ncbi\.nlm\.nih\.gov\/\d+\/?$/i,  // PubMed URL
    ];
    
    // PMCID patterns
    const pmcidPatterns = [
      /^PMC\d+$/i,  // PMC ID format
      /^PMCID:\s*PMC\d+$/i,  // PMCID with prefix
      /^https?:\/\/www\.ncbi\.nlm\.nih\.gov\/pmc\/articles\/PMC\d+\/?$/i,  // PMC URL
    ];
    
    // URL pattern (comprehensive)
    const urlPattern = /^https?:\/\/(?:[-\w.])+(?::\d+)?(?:\/(?:[\w\/_.])*(?:\?(?:[\w&=%.])*)?(?:#(?:[\w.])*)?)?$/i;
    
    // Check if it matches any of the valid patterns
    const allPatterns = [...doiPatterns, ...pmidPatterns, ...pmcidPatterns, urlPattern];
    
    return allPatterns.some(pattern => pattern.test(trimmedUri));
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
