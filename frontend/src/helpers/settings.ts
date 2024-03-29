import { StatementStateToColor, SentenceStateToColor } from "./helpers";

export const duplicatesRowsPerPage = 10;
export const autocompleteRows = 100;

export const statementStateToColor: StatementStateToColor = {
  compose_now: "success", //red
  curated: "success", // green
  to_be_reviewed: "warning", //orange
  excluded: "info", //grey
  draft: "primary", // blue
  rejected: "info", //grey,
  connection_missing: "warning", // orange
  npo_approved: "success", //green
  exported: "success", //green
  invalid: "warning", //orange
};

export const sentenceStateToColor: SentenceStateToColor = {
  open: "primary", //blue,
  compose_now: "success", //green
  compose_later: "warning", // orange
  to_be_reviewed: "warning", //orange
  excluded: "info", //grey
  duplicate: "info", //grey
};

export const OriginsGroupLabel = "Origins";
export const ViasGroupLabel = "Vias";
export const DestinationsGroupLabel = "Destinations";
