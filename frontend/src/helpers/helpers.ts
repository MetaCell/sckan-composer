import {AnatomicalEntity, SentenceAvailableTransitionsEnum as sentenceStates} from "../apiclient/backend/api";
import { ComposerConnectivityStatementListStateEnum as statementStates } from "../apiclient/backend/api";

export const hiddenWidget = (fields: string[]) => {
  let hiddenSchema = {}
  for (const f of fields) {
    hiddenSchema = {
      ...hiddenSchema,
      [f]: {
        "ui:widget": "hidden"
      }
    }
  }
  return hiddenSchema
}

export const removeFieldsFromSchema = (schema: any, fields: string[]) => {
  for (const f of fields) {
    delete schema.properties[f]
    const index = schema.required.indexOf(f)
    if (index > -1) {
      schema.required.splice(index, 1)
    }
  }
  return schema
}



export const mapSortingModel = (ordering: string) => {
  let model: any[] = []
  if (ordering.charAt(0) === "-") {
    model.push({ field: ordering.slice(1), sort: "desc" })
  }
  else { model.push({ field: ordering, sort: "asc" }) }
  return {
    sorting: {
      sortModel: model,
    },
  }
}

export const mapStateFilterSelectionToCheckbox = (availableFilterOptions: any, currentSelection: any) => {
  let initialSelection: { [key: string]: boolean } = {}
  let i: keyof typeof availableFilterOptions
  for (i in availableFilterOptions) {
    const filterOption: string = availableFilterOptions[i]
    initialSelection = {
      ...initialSelection,
      [filterOption]: !currentSelection ? false : currentSelection.includes(filterOption),
    }
  }
  return initialSelection
}

export const mapTagFilterSelectionToCheckbox = (tags: any[], currentSelection: any) => {
  let initialSelection: { [key: string]: boolean } = {}
  tags.forEach(i => initialSelection = {
    ...initialSelection,
    [i.id.toString()]: !currentSelection ? false : currentSelection.includes(i.id.toString())
  })
  return initialSelection
}

export const snakeToSpace = (str: string) => {
  return str?.replaceAll('_', ' ').split(' ').map((word) => {
    return word[0].toUpperCase() + word.substring(1)
  }).join(" ")
}
export type StateColor =
  | "default"
  | "primary"
  | "secondary"
  | "error"
  | "info"
  | "success"
  | "warning"

export interface SentenceStateToColor {
  open: StateColor
  compose_now: StateColor
  compose_later: StateColor
  to_be_reviewed: StateColor
  excluded: StateColor
  duplicate: StateColor
}

export interface StatementStateToColor {
  compose_now: StateColor
  curated: StateColor
  to_be_reviewed: StateColor
  excluded: StateColor
  draft: StateColor
  rejected: StateColor
  connection_missing: StateColor
  npo_approved: StateColor
  exported: StateColor
}

export const SentenceLabels = {
  [sentenceStates.Open]: "Open",
  [sentenceStates.ToBeReviewed]: "To be reviewed",
  [sentenceStates.ComposeLater]: "Compose later",
  [sentenceStates.ComposeNow]: "Compose now",
  [sentenceStates.Duplicate]: "Duplicate",
  [sentenceStates.Excluded]: "Excluded",
}
export const StatementsLabels = {
  [statementStates.ToBeReviewed]: "To be reviewed",
  [statementStates.ComposeNow]: "Compose now",
  [statementStates.Excluded]: "Exclude",
  [statementStates.Draft]: "Draft",
  [statementStates.Curated]: "Curate",
  [statementStates.Rejected]: "Reject",
  [statementStates.ConnectionMissing]: "Connection missing",
  [statementStates.NpoApproved]: "NPO approved",
  [statementStates.Exported]: "Exported",
}

export const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("en-UK", {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export const formatTime = (date: string) => {
  return new Date(date).toLocaleDateString("en-UK", {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  });
}

export const timeAgo = (timestamp: string) => {
  const now = new Date();
  const timeDiff = now.getTime() - new Date(timestamp).getTime();
  const seconds = Math.floor(timeDiff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const years = Math.floor(weeks / 52);

  if (years > 0) {
    return `${years} year${years > 1 ? 's' : ''} ago`;
  } else if (weeks > 0) {
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else {
    return `${seconds} second${seconds > 0 ? 's' : ''} ago`;
  }
}


export const isEqual = function (obj1: any, obj2: any) {
  const obj1Keys = Object.keys(obj1);
  const obj2Keys = Object.keys(obj2);

  if (obj1Keys.length !== obj2Keys.length) {
    return false;
  }

  for (let objKey of obj1Keys) {
    if (obj1[objKey] !== obj2[objKey]) {
      if (typeof obj1[objKey] == "object" && typeof obj2[objKey] == "object") {
        if (!isEqual(obj1[objKey], obj2[objKey])) {
          return false;
        }
      }
      else {
        return false;
      }
    }
  }

  return true;
};


export function searchAnatomicalEntities(entities: AnatomicalEntity[], searchValue:string) {
  const normalizedSearchValue = searchValue.toLowerCase();

  return entities.filter(entity =>
      entity.name.toLowerCase().includes(normalizedSearchValue)
  ).sort((a, b) => a.name.localeCompare(b.name));
}