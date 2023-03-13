
import { StatementStateToColor, SentenceStateToColor } from "./helpers";

export const duplicatesRowsPerPage = 10;
export const duplicatesSelectRowsPerPage = 100;
export const chartHeight = 360;
export const chartWidth = 700;

export const statementStateToColor: StatementStateToColor = {
    compose_now: "error", //red
    curated: "success", // green
    to_be_reviewed: "warning", //orange
    excluded: "info", //grey
    draft: "primary", // blue
    rejected: "info", //grey,
    connection_missing: "warning", // orange
    npo_approved: "success", //green
    approved: "success", //green
}

export const sentenceStateToColor: SentenceStateToColor = {
    open: "primary", //blue,
    compose_now: "success", //green
    compose_later: "warning", // orange
    to_be_reviewed: "warning", //orange
    excluded: "info", //grey
    duplicate: "info", //grey
}
