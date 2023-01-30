import { composerApi } from "./apis";
import { Note } from "../apiclient/backend";


export async function noteCreate(formNote:Note): Promise<any> {
    const response = await composerApi.composerNoteCreate(formNote)
    return response.data
}
