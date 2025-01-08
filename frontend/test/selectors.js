const LOGIN_PAGE = '.mat-form-field-infix';
const USERNAME = 'input[formcontrolname="username"]';
const PASSWORD = 'input[formcontrolname="password"]';
const SIGN_IN_BUTTON = '#signin-button';
const SEARCH_ICON = 'svg[data-testid="SearchIcon"]';
const SEARCH_BAR = 'div:has(> input[placeholder="Search for Sentences"])';
const ADD_RECORD = 'button.MuiButtonBase-root.MuiButton-root.MuiButton-contained.MuiButton-containedPrimary';
const ARTICLE_LABEL = 'input[placeholder="Enter Article Title"]';
const ARTICLE_FIELD = 'div:has(> input[placeholder="Enter Article Title"])';
const PMID_FIELD = 'div:has(> input[placeholder="Enter PMID"])';
const PMCID_FIELD = 'div:has(> input[placeholder="Enter PMCID"])';
const DOI_FIELD = 'div:has(> input[placeholder="Enter DOI"])';
const SENTENCE_FIELD = 'div:has(> textarea[placeholder="Enter the sentence"])';
const CREATE_SENTENCE = 'button[type="submit"][tabindex="0"]';
const SENTENCE_DETAILS_TITLE = 'h3.MuiTypography-root.MuiTypography-h3';
const SENTENCE_PAGE = 'h5.MuiTypography-root.MuiTypography-h5';
const TABLE_ROW = 'div[data-rowindex="0"][role="row"]';
const ADD_KNOWLEDGE_STATEMENT = 'button.MuiButtonBase-root.MuiButton-root.MuiButton-contained.MuiButton-containedPrimary.MuiButton-sizeMedium.MuiButton-containedSizeMedium.MuiButton-fullWidth.MuiButton-root.MuiButton-contained.MuiButton-containedPrimary.MuiButton-sizeMedium.MuiButton-containedSizeMedium.MuiButton-fullWidth';
const SPECIES_FIELD = 'div:has(> input[placeholder="Select Species"])';
const KS_FIELD = 'div:has(> textarea[placeholder="Enter Knowledge Statement"])';
const PROVENANCE_FIELD = 'div:has(> input[placeholder="Enter Provenances (Press Enter to add a Provenance)"])';
const RIGHT_ROOT_LATERALITY = 'span:has(> input[id="root_laterality-0"])';
const IPSI_PROJECTION = 'span:has(> input[id="root_projection-0"])';
const SENSORY_CIRCUIT_TYPE = 'span:has(> input[id="root_circuit_type-0"])';
const APINATOMY_MODEL = 'div:has(> input[placeholder="Enter ApiNATOMY Model Name"])';
const ADDITIONAL_INFORMATION = 'div:has(> textarea[placeholder="Enter additional information on the knowledge statement"])';
const PROGRESS_LOADER = 'span[role="progressbar"]';
const STATUS_BUTTON = 'div.MuiButtonGroup-root.MuiButtonGroup-contained';
const PROOFING_TAB = 'button[role="tab"][aria-selected="false"]';
const NOT_SPECIFIED_BUTTON = 'div.MuiInputBase-root.MuiOutlinedInput-root.MuiInputBase-colorPrimary.MuiInputBase-formControl:has(> div.MuiSelect-select.MuiSelect-standard.MuiInputBase-input.MuiOutlinedInput-input)';
const ADD_VIA = 'button.MuiButtonBase-root.MuiButton-root.MuiButton-text.MuiButton-textInfo.MuiButton-sizeMedium.MuiButton-textSizeMedium.MuiButton-root.MuiButton-text.MuiButton-textInfo.MuiButton-sizeMedium.MuiButton-textSizeMedium';
const VIA_FIELD = 'div:has(> input[placeholder="Select Via"])';
const DESTINATION_FIELD = 'div:has(> input[placeholder="Select Destination"])';
const TAGS_FIELD = 'div:has(> input[placeholder="Select Tags"])';
const NOTES_FIELD = 'div:has(> textarea[placeholder="Write your note"])';
const STATEMENT_PREVIEW = 'rect.nsewdrag.drag';
const STATEMENT_PREVIEW_TITLE = 'h5.MuiTypography-root.MuiTypography-h5 + p.MuiTypography-root.MuiTypography-body1';
const LOGOUT = 'button[aria-label="logout"]';
const SEND_BUTTON = 'button[label="Send"]';
const STATUS_DROPDOWN = 'button[aria-label="select merge strategy"]';
const COOKIE_MODAL = "#onetrust-policy-title";
const ACCEPT_COOKIES = "#onetrust-accept-btn-handler";
const SEARCH_FOR_KS = 'div:has(> input[placeholder="Search for Knowledge Statements"])';
const ADD_BUTTON_PATH_BUILDER = 'button.MuiButtonBase-root.MuiButton-root.MuiButton-text.MuiButton-textInfo.MuiButton-sizeMedium.MuiButton-textSizeMedium.MuiButton-root.MuiButton-text.MuiButton-textInfo.MuiButton-sizeMedium.MuiButton-textSizeMedium';
const ADDED_ELEMENT = 'div.MuiSelect-select.MuiSelect-standard.MuiInputBase-input.MuiOutlinedInput-input.MuiInputBase-inputAdornedStart';
const ORIGIN_FIELD = 'form[class="origins"] > div > div  > div  > div  > div  > div  > div > span > div ';
const SEARCH_ORIGINS = 'div:has(> input[placeholder="Search for Origins"])';
const CHECKBOX_ITEM = '.MuiButtonBase-root.MuiCheckbox-root.MuiCheckbox-colorPrimary.MuiCheckbox-sizeMedium.PrivateSwitchBase-root.MuiCheckbox-root.MuiCheckbox-colorPrimary.MuiCheckbox-sizeMedium.MuiCheckbox-root.MuiCheckbox-colorPrimary.MuiCheckbox-sizeMedium';
const FIRST_SEARCHED_ELEMENT = 'li:has(> .MuiButtonBase-root.MuiCheckbox-root.MuiCheckbox-colorPrimary.MuiCheckbox-sizeMedium.PrivateSwitchBase-root.MuiCheckbox-root.MuiCheckbox-colorPrimary.MuiCheckbox-sizeMedium.MuiCheckbox-root.MuiCheckbox-colorPrimary.MuiCheckbox-sizeMedium';
const VIAS_FROM_FIELD = 'form[class="vias"] > div > div > div > div > div > div > tr > td.MuiTableCell-root.MuiTableCell-sizeMedium.inLineForm:nth-child(2) > div > div > div > div:nth-child(4) > div > div > div > span > div';
const VIAS_FIELD = 'form[class="vias"] > div > div > div > div > div > div > tr > td.MuiTableCell-root.MuiTableCell-sizeMedium.inLineForm:nth-child(2) > div > div > div > div:nth-child(3) > div > div > div > span > div';
const SEARCH_FOR_VIAS = 'div:has(> input[placeholder="Search for vias"])';
const DESTINATION_FROM_FIELD = 'form[class="destinations"] > div > div > div > div > div > div > tr > td.MuiTableCell-root.MuiTableCell-sizeMedium.inLineForm:nth-child(1) > div > div > div > div:nth-child(3) > div > div > div > span > div';
const FROM_FIELD = 'form[class="destinations"] > div > div > div > div > div > div > tr > td > div > div > div > div:nth-child(2) > div > div > div > span > div';
const SEARCH_FOR_DESTINATIONS = 'div:has(> input[placeholder="Search for Destinations"])';
const BIOTECH_ICON_SELECTOR = 'svg[data-testid="BiotechOutlinedIcon"]';

module.exports = {
  LOGIN_PAGE,
  USERNAME,
  PASSWORD,
  SIGN_IN_BUTTON,
  SEARCH_ICON,
  SEARCH_BAR,
  ADD_RECORD,
  ARTICLE_LABEL,
  ARTICLE_FIELD,
  PMID_FIELD,
  PMCID_FIELD,
  DOI_FIELD,
  SENTENCE_FIELD,
  CREATE_SENTENCE,
  SENTENCE_DETAILS_TITLE,
  SENTENCE_PAGE,
  TABLE_ROW,
  ADD_KNOWLEDGE_STATEMENT,
  SPECIES_FIELD,
  KS_FIELD,
  PROVENANCE_FIELD,
  RIGHT_ROOT_LATERALITY,
  IPSI_PROJECTION,
  SENSORY_CIRCUIT_TYPE,
  APINATOMY_MODEL,
  ADDITIONAL_INFORMATION,
  PROGRESS_LOADER,
  STATUS_BUTTON,
  PROOFING_TAB,
  NOT_SPECIFIED_BUTTON,
  ADD_VIA,
  VIA_FIELD,
  DESTINATION_FIELD,
  TAGS_FIELD,
  NOTES_FIELD,
  STATEMENT_PREVIEW,
  STATEMENT_PREVIEW_TITLE,
  LOGOUT,
  SEND_BUTTON,
  STATUS_DROPDOWN,
  COOKIE_MODAL,
  ACCEPT_COOKIES,
  SEARCH_FOR_KS,
  ADD_BUTTON_PATH_BUILDER,
  ADDED_ELEMENT,
  ORIGIN_FIELD,
  SEARCH_ORIGINS,
  CHECKBOX_ITEM,
  FIRST_SEARCHED_ELEMENT,
  VIAS_FROM_FIELD,
  VIAS_FIELD,
  SEARCH_FOR_VIAS,
  DESTINATION_FROM_FIELD,
  FROM_FIELD,
  SEARCH_FOR_DESTINATIONS,
  BIOTECH_ICON_SELECTOR,
};