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

export const mapCheckboxInfo = (items: any[], selectedFilters: any) => {
  let mappedItems = items.map(i => ({ name: i.id, label: i.tag, checked: selectedFilters.tags[i.id] }))
  return mappedItems
}

export const snakeToSpace = (str: string) => {
  return str.replaceAll('_',' ').split(' ').map((word) => {
    return word[0].toUpperCase() + word.substring(1);
  }).join(" ");
}