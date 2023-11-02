import {Option} from "../types";
import {composerApi as api} from "./apis";
import {autocompleteRows} from "../helpers/settings";
import {mapAnatomicalEntitiesToOptions} from "../helpers/dropdownMappers";


export async function getOrigins(searchValue: string): Promise<Option[]> {
    try {
        const response = await api.composerAnatomicalEntityList(autocompleteRows, searchValue, 0);
        const anatomicalEntities = response.data.results || [];
        return mapAnatomicalEntitiesToOptions(anatomicalEntities, 'Origins');
    } catch (error) {
        console.error('Error fetching anatomical entities:', error);
        return [];
    }
}
