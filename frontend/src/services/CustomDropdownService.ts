import {Option} from "../types";
import {composerApi as api} from "./apis";
import {autocompleteRows} from "../helpers/settings";
import {mapAnatomicalEntitiesToOptions} from "../helpers/dropdownMappers";
import {
    DestinationSerializerDetails,
    PatchedConnectivityStatementUpdate,
    PatchedDestination,
    PatchedVia,
    ViaSerializerDetails
} from "../apiclient/backend";


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


export async function updateOrigins(selected: Option[], statementId: number){
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

export async function updateViaAnatomicalEntities(selected: Option[], viaId: number | null){
    if(viaId == null){
        console.error("Error updating via")
        return
    }
    const anatomicalEntitiesIds = selected.map(option => parseInt(option.id));
    const patchedVia: PatchedVia = {
        anatomical_entities: anatomicalEntitiesIds,
    };
    try {
        await api.composerViaPartialUpdate(viaId, patchedVia);
    } catch (error) {
        console.error('Error updating via', error);
    }
}

export async function updateDestinationAnatomicalEntities(selected: Option[], destinationId: number | null){
    if(destinationId == null){
        console.error("Error updating destination")
        return
    }
    const anatomicalEntitiesIds = selected.map(option => parseInt(option.id));
    const patchedDestination: PatchedDestination = {
        anatomical_entities: anatomicalEntitiesIds,
    };
    try {
        await api.composerDestinationPartialUpdate(destinationId, patchedDestination);
    } catch (error) {
        console.error('Error updating destination', error);
    }
}

export function getConnectionId(formId: string, connections: ViaSerializerDetails[] | DestinationSerializerDetails[]): number | null  {
    const index = getFirstNumberFromString(formId)
    if(index != null){
        return connections[index].id
    }
    return null

}

function getFirstNumberFromString(inputString: string) {
    const match = inputString.match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
}