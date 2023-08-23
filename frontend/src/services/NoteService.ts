import { composerApi } from "./apis"
import { Note } from "../apiclient/backend"
import { AbstractService } from "./AbstractService"


class NoteService extends AbstractService {
  async save(note: Note) {
    return composerApi.composerNoteCreate(note).then((response: any) => response.data)
  }
  async getNotesList(connectivityStatementId?: number, limit?: number, offset?: number, sentenceId?: number) {
    return composerApi.composerNoteList(connectivityStatementId, limit, offset, sentenceId).then((res: any) => res.data)
  }
  async getObject(id: string): Promise<Note> {
    return {} as Note
  }
}

const noteService = new NoteService()
export default noteService
