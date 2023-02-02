import { composerApi } from "./apis"
import { Note } from "../apiclient/backend"
import { AbstractService } from "./AbstractService"


class NoteService extends AbstractService {
  async save(note: Note) {
    return composerApi.composerNoteCreate(note).then((response: any) => response.data)
  }
  async getObject(id: string): Promise<Note> {
    return {} as Note
  }
}

export default new NoteService()