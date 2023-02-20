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
    delete schema.properties[f];
    const index = schema.required.indexOf(f);
    if (index > -1) {
      schema.required.splice(index, 1);
    }
  }
  return schema;
}



export const mapSortingModel = (ordering: string) => {
  let model: any[] = [];
  if (ordering.charAt(0) === "-") {
    model.push({ field: ordering.slice(1), sort: "desc" });
  }
  else { model.push({ field: ordering, sort: "asc" }) };
  return {
    sorting: {
      sortModel: model,
    },
  };
};

export const mapStateFilterSelectionToCheckbox = (availableFilterOptions: any, currentSelection: any) => {
  let initialSelection: { [key: string]: boolean } = {}
  let i: keyof typeof availableFilterOptions;
  for (i in availableFilterOptions) {
    const filterOption: string = availableFilterOptions[i];
    initialSelection = {
      ...initialSelection,
      [filterOption]: !currentSelection ? false : currentSelection.includes(filterOption),
    };
  }
  return initialSelection
}

export const mapTagFilterSelectionToCheckbox = (tags: any[], currentSelection: any) => {
  let initialSelection: { [key: string]: boolean } = {};
  tags.forEach(i => initialSelection = {
    ...initialSelection,
    [i.id.toString()]: !currentSelection ? false : currentSelection.includes(i.id.toString())
  })
  return initialSelection
}

export const snakeToSpace = (str: string) => {
  return str.replaceAll('_', ' ').split(' ').map((word) => {
    return word[0].toUpperCase() + word.substring(1);
  }).join(" ");
}
export type color =
  | "default"
  | "primary"
  | "secondary"
  | "error"
  | "info"
  | "success"
  | "warning";

export interface StateToColor {
  open: color;
  compose_now: color;
  compose_later: color;
  curated: color;
  to_be_reviewed: color;
  excluded: color;
  duplicate: color;
  draft: color;
  rejected: color;
  connection_missing: color;
  npo_approved: color;
  approved: color;
}



