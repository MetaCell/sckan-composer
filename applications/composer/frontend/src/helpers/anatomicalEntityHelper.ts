import { AnatomicalEntity } from "../apiclient/backend";
import { OptionDetail } from "../types";

export const DROPDOWN_MAPPER_ONTOLOGY_URL = "Ontology URI";
export const DROPDOWN_MAPPER_LAYER_URI = "Layer URI";
export const DROPDOWN_MAPPER_REGION_URI = "Region URI";


export const getAnatomicalEntityDetails = (entity: AnatomicalEntity): OptionDetail[] => {
  let details: OptionDetail[] = [
    {
      title: "Label",
      value: getName(entity),
    },
    {
      title: "Synonyms",
      value: entity.synonyms
    }
  ]
  if (entity.region_layer) {
    if (entity.region_layer.region) {
      details.push(
        {
          title: "Region",
          value: getRegionName(entity)
        },
        {
          title: DROPDOWN_MAPPER_REGION_URI,
          value: getRegionURI(entity)
        }
      )
    }
    if (entity.region_layer.layer) {
      details.push(
        {
          title: "Layer",
          value: getLayerName(entity)
        },
        {
          title: DROPDOWN_MAPPER_LAYER_URI,
          value: getLayerURI(entity)
        }
      )
    }
  }
  if (entity.simple_entity) {
    details.push(
      {
        title: DROPDOWN_MAPPER_ONTOLOGY_URL,
        value: getURI(entity)
      }
    )
  }
  return details
}

export const getName = (anatomicalEntity: AnatomicalEntity) => {
  if (anatomicalEntity.region_layer) {
    return `${anatomicalEntity.region_layer.region.name} (${anatomicalEntity.region_layer.layer.name})`
  }
  return anatomicalEntity.simple_entity.name
}

export const getURI = (anatomicalEntity: AnatomicalEntity) => {
  if (anatomicalEntity.region_layer) {
    return `${anatomicalEntity.region_layer.region.ontology_uri},${anatomicalEntity.region_layer.layer.ontology_uri}`
  }
  return anatomicalEntity.simple_entity.ontology_uri
}

export const getLayerName = (anatomicalEntity: AnatomicalEntity) => {
  if (anatomicalEntity.region_layer) {
    return anatomicalEntity.region_layer.layer.name
  }
  return "N/A"
}

export const getRegionName = (anatomicalEntity: AnatomicalEntity) => {
  if (anatomicalEntity.region_layer) {
    return anatomicalEntity.region_layer.region.name
  }
  return "N/A"
}

export const getLayerURI = (anatomicalEntity: AnatomicalEntity) => {
  if (anatomicalEntity.region_layer) {
    return anatomicalEntity.region_layer.layer.ontology_uri
  }
  return "N/A"
}

export const getRegionURI = (anatomicalEntity: AnatomicalEntity) => {
  if (anatomicalEntity.region_layer) {
    return anatomicalEntity.region_layer.region.ontology_uri
  }
  return "N/A"
}



