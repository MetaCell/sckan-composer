import {AnatomicalEntity} from "../apiclient/backend";

export const getName = (anatomicalEntity: AnatomicalEntity) => {
  if (anatomicalEntity.region_layer) {
    return `${anatomicalEntity.region_layer.region.name},${anatomicalEntity.region_layer.layer.name}`
  }
  return anatomicalEntity.simple_entity.name
}

export const getURI = (anatomicalEntity: AnatomicalEntity) => {
  if (anatomicalEntity.region_layer) {
    return `${anatomicalEntity.region_layer.region.ontology_uri},${anatomicalEntity.region_layer.layer.ontology_uri}`
  }
  return anatomicalEntity.simple_entity.ontology_uri
}