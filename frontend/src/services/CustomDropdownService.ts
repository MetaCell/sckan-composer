import {Option} from "../types";
import {composerApi as api} from "./apis";
import {autocompleteRows} from "../helpers/settings";
import {mapAnatomicalEntitiesToOptions} from "../helpers/dropdownMappers";
import {PatchedConnectivityStatementUpdate} from "../apiclient/backend";


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