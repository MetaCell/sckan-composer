import {AnatomicalEntity} from "../apiclient/backend";
import {Option} from "../types";

export function mapAnatomicalEntitiesToOptions(entities: AnatomicalEntity[], groupLabel: string): Option[] {
    if(!entities){
        return []
    }
    return entities.map(entity => ({
        id: entity.id.toString(),
        label: entity.name,
        group: groupLabel,
        content: [
            {
                title: "Name",
                value: entity.name,
            },
            {
                title: "Ontology URI",
                value: entity.ontology_uri,
            },
        ],
    }));
}