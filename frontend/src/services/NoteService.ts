import { composerApi } from "./apis";
import { Note } from "../apiclient/backend";
import { userProfile } from "./UserService";

const profile = userProfile.getProfile()


export async function createNote(formNote:any, sentenceId: any): Promise<any> {
    const note = mapFormDataToNote(formNote, sentenceId)
    const response = await composerApi.composerNoteCreate(note, {xsrfCookieName: 'csrftoken', xsrfHeaderName:'X-CSRFToken'})
    return response.data
}

function mapFormDataToNote(formData:any, sentenceId:string): Note{
    const note = {
        note: formData.newNote, 
        sentence: Number(sentenceId),
        id:0,
        user:profile.user.id
    }
    return note
}