import { composerApi } from "./apis";
import { Note } from "../apiclient/backend";


export async function noteCreate(formNote:Note): Promise<any> {
    const response = await composerApi.composerNoteCreate(formNote)
    return response.data
}

export async function getSentenceJsonSchema(): Promise<any> {
    return composerApi.composerNoteJsonschemaRetrieve().then((response: any) => {
        if(response.status === 200){
            return response.data
        } else {
            console.log("Error")
        }
    })
}
