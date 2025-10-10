/**
 * Validates if a URI is a valid DOI, PMID, PMCID, or URL
 * @param uri - The URI string to validate
 * @returns true if the URI is valid, false otherwise
 */
export const isValidURI = (uri: string): boolean => {
  if (!uri || !uri.trim()) {
    return false;
  }
  
  const trimmedUri = uri.trim();
  
  // DOI patterns
  const doiPatterns = [
    /^10\.\d{4,}\/[a-zA-Z0-9\-._():]+(?:\/[a-zA-Z0-9\-._():]+)*$/,  // Standard DOI format - no consecutive slashes
    /^doi:10\.\d{4,}\/[a-zA-Z0-9\-._():]+(?:\/[a-zA-Z0-9\-._():]+)*$/i,  // DOI with prefix
    /^https?:\/\/doi\.org\/10\.\d{4,}\/[a-zA-Z0-9\-._():]+(?:\/[a-zA-Z0-9\-._():]+)*$/i,  // DOI URL
    /^https?:\/\/dx\.doi\.org\/10\.\d{4,}\/[a-zA-Z0-9\-._():]+(?:\/[a-zA-Z0-9\-._():]+)*$/i,  // Alternative DOI URL
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
  
  // URL pattern
  const urlPattern = /^https?:\/\/[a-zA-Z0-9\-.]+(?::[0-9]+)?(?:\/[a-zA-Z0-9\-._~!$&'()*+,;=:@]+)*(?:\?[a-zA-Z0-9\-._~!$&'()*+,;=:@/?]*)?(?:#[a-zA-Z0-9\-._~!$&'()*+,;=:@/?]*)?$/i;
  
  // Check if it matches any of the valid patterns
  const allPatterns = [...doiPatterns, ...pmidPatterns, ...pmcidPatterns, urlPattern];
  
  return allPatterns.some(pattern => pattern.test(trimmedUri));
};

/**
 * Validates if a string is a valid URL (http/https)
 * @param uri - The URI string to validate
 * @returns true if the URI is a valid URL, false otherwise
 */
export const isValidUrl = (uri: string): boolean => {
  const urlPattern = new RegExp('^(https?://)?'+ 
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ 
    '((\\d{1,3}\\.){3}\\d{1,3}))'+ 
    '(\\:\\d+)?(/[-a-z\\d%_.~+]*)*'+ 
    '(\\?[;&a-z\\d%_.~+=-]*)?'+ 
    '(#[-a-z\\d_]*)?$','i');
  
  return !!uri.match(urlPattern);
};

/**
 * Gets the validation error message for URI fields
 * @param fieldName - Optional name of the field (e.g., "provenance", "expert consultant")
 * @returns A formatted error message string
 */
export const getURIValidationErrorMessage = (fieldName: string = "URI"): string => {
  return `Invalid ${fieldName} format. Please enter a valid:\n` +
    "• DOI (e.g., '10.1000/xyz123' or 'https://doi.org/10.1000/xyz123')\n" +
    "• PMID (e.g., 'PMID:12345678' or 'https://pubmed.ncbi.nlm.nih.gov/12345678')\n" +
    "• PMCID (e.g., 'PMC1234567' or 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC1234567')\n" +
    "• URL (e.g., 'https://example.com')";
};
