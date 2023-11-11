import {Option} from "../types";
import {composerApi as api} from "./apis";
import {autocompleteRows} from "../helpers/settings";
import {mapAnatomicalEntitiesToOptions} from "../helpers/dropdownMappers";
import {
    AnatomicalEntity,
    ConnectivityStatement,
    DestinationSerializerDetails,
    PatchedConnectivityStatementUpdate, PatchedDestination, PatchedVia,
    ViaSerializerDetails
} from "../apiclient/backend";
import {searchAnatomicalEntities} from "../helpers/helpers";


export async function getAnatomicalEntities(searchValue: string, groupLabel: string): Promise<Option[]> {
    try {
        const response = await api.composerAnatomicalEntityList(autocompleteRows, searchValue, 0);
        const anatomicalEntities = response.data.results || [];
        return mapAnatomicalEntitiesToOptions(anatomicalEntities, groupLabel);
    } catch (error) {
        console.error('Error fetching anatomical entities:', error);
        return [];
    }
}


export async function updateOrigins(selected: Option[], statementId: number) {
    const originIds = selected.map(option => parseInt(option.id));
    const patchedStatement: PatchedConnectivityStatementUpdate = {
        origins: originIds,
    };
    try {
        await api.composerConnectivityStatementPartialUpdate(statementId, patchedStatement);
    } catch (error) {
        console.error('Error updating origins', error);
    }

}

export type UpdateEntityParams = {
    selected: Option[];
    entityId: number | null;
    entityType: 'via' | 'destination';
    propertyToUpdate: 'anatomical_entities' | 'from_entities';
};

const apiFunctionMap = {
    'via': (id: number, patchedVia: PatchedVia) => api.composerViaPartialUpdate(id, patchedVia),
    'destination': (id: number, patchedDestination: PatchedDestination) => api.composerDestinationPartialUpdate(id, patchedDestination),
};

export async function updateEntity({ selected, entityId, entityType, propertyToUpdate }: UpdateEntityParams) {
    if (entityId == null) {
        console.error(`Error updating ${entityType}`);
        return;
    }

    const entityIds = selected.map(option => parseInt(option.id));
    const patchObject = { [propertyToUpdate]: entityIds };

    try {
        const updateFunction = apiFunctionMap[entityType];
        if (updateFunction) {
            await updateFunction(entityId, patchObject);
        } else {
            console.error(`No update function found for entity type: ${entityType}`);
        }
    } catch (error) {
        console.error(`Error updating ${entityType}`, error);
    }
}

export function getConnectionId(formId: string, connections: ViaSerializerDetails[] | DestinationSerializerDetails[]): number | null {
    const index = getFirstNumberFromString(formId)
    if (index != null) {
        return connections[index].id
    }
    return null

}

function getFirstNumberFromString(inputString: string) {
    const match = inputString.match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
}

export function searchFromEntitiesVia(searchValue: string, statement: ConnectivityStatement, formId: string): Option[] {
    const viaIndex = getFirstNumberFromString(formId)
    if(viaIndex == null || statement.vias == null || statement.vias[viaIndex] == null){
        console.error('Error searching from entities');
        return []
    }
    const viaOrder = statement.vias[viaIndex].order
    const anatomicalEntities = getEntitiesBeforeOrder(statement, viaOrder)

    return mapAnatomicalEntitiesToOptions(searchAnatomicalEntities(anatomicalEntities, searchValue), 'From Entities')
}

export function searchFromEntitiesDestination(searchValue: string, statement: ConnectivityStatement): Option[] {
    const vias = statement.vias || []
    const maxOrder = vias.reduce((maxOrder, via) => {
        return via.order > maxOrder ? via.order : maxOrder;
    }, 0) + 1
    const anatomicalEntities = getEntitiesBeforeOrder(statement, maxOrder)

    return mapAnatomicalEntitiesToOptions(searchAnatomicalEntities(anatomicalEntities, searchValue), 'From Entities')
}

function getEntitiesBeforeOrder(statement: ConnectivityStatement, order: number) {
    const entities = statement.origins != null ? [...statement.origins] : []
    const vias = statement.vias || []
    return vias.reduce((acc, via) => {
        if (via.order < order) {
            via.anatomical_entities.forEach(entity => {
                acc.push(entity);
            });
        }
        return acc;
    }, entities as AnatomicalEntity[]);
}
