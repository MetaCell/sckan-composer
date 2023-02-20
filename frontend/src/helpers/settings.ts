
import { StateToColor } from "./helpers";

export const duplicatesRowsPerPage = 10;
export const duplicatesSelectRowsPerPage = 100;


export const stateToColor: StateToColor = {
    open: "primary", //blue,
    compose_now: "error", //red
    compose_later: "warning", // orange
    curated: "success", // green
    to_be_reviewed: "warning", //orange
    excluded: "info", //grey
    duplicate: "info", //grey
    draft: "primary", // blue
    rejected: "info", //grey,
    connection_missing: "warning", // orange
    npo_approved: "success", //green
    approved: "success", //green
};