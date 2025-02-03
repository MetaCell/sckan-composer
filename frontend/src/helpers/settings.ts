import { StatementStateToColor, SentenceStateToColor } from "./helpers";

export const duplicatesRowsPerPage = 10;
export const autocompleteRows = 100;

export const statementStateToColor: StatementStateToColor = {
  draft: "primary", // blue
  compose_now: "success", //red
  in_progress: "success", // green
  to_be_reviewed: "warning", //orange
  revise: "warning", //grey
  rejected: "info", //grey,
  npo_approved: "info", //green
  exported: "info", //green
  invalid: "warning", //green
};

export const sentenceStateToColor: SentenceStateToColor = {
  open: "primary", //blue,
  needs_further_review: "warning", //orange
  compose_later: "warning", // orange
  ready_to_compose: "success", //green
  compose_now: "success", //green
  completed: "info", //grey
  excluded: "info", //grey
};

export const OriginsGroupLabel = "Origins";
export const ViasGroupLabel = "Vias";
export const DestinationsGroupLabel = "Destinations";

export const ChangeRequestStatus = {
  CANCELLED: "canceled",
  SAVED: "saved",
}

export enum ENTITY_TYPES {
  STATEMENT = "statement",
  SENTENCE = "sentence",
}
