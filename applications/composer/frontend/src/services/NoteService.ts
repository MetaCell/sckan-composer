import { composerApi } from "./apis"
import { Note } from "../apiclient/backend"
import { AbstractService } from "./AbstractService"
import {checkOwnership, checkSentenceOwnership} from "../helpers/ownershipAlert";
import {ChangeRequestStatus} from "../helpers/settings";
class NoteService extends AbstractService {
  async save(note: Note, onCancel: () => void = () => {}) {
    try {
      return await composerApi.composerNoteCreate(note).then((response: any) => response.data);
    } catch (err) {
      const defaultOnCancel = typeof onCancel === 'function' ? onCancel : () => {
        return ChangeRequestStatus.CANCELLED;
      };
      
      if (note.sentence_id !== undefined && note.sentence_id !== null) {
        const id = note.sentence_id;
        return await checkSentenceOwnership(
          id,
          async () => {
            return await composerApi.composerNoteCreate(note).then((response: any) => response.data);
          },
          defaultOnCancel,
          (owner) =>
            `This sentence is currently assigned to ${owner.first_name}. You are in read-only mode. Would you like to assign this sentence to yourself and gain edit access?`
        );
      } else if (note.connectivity_statement_id !== undefined && note.connectivity_statement_id !== null) {
        const id = note.connectivity_statement_id;
        return await checkOwnership(
          id,
          async () => {
            return await composerApi.composerNoteCreate(note).then((response: any) => response.data);
          },
          defaultOnCancel,
          (owner) =>
            `This statement is currently assigned to ${owner.first_name}. You are in read-only mode. Would you like to assign this statement to yourself and gain edit access?`
        );
      } else {
        return Promise.reject("Invalid note type: missing both sentence_id and connectivity_statement_id.");
      }
    }
  }
  async getNotesList(connectivityStatementId?: number, includeSystemNotes?: boolean, limit?: number, offset?: number, sentenceId?: number) {
    return composerApi.composerNoteList(connectivityStatementId, includeSystemNotes, limit, offset, sentenceId).then((res: any) => res.data)
  }
  async getObject(id: string): Promise<Note> {
    return {} as Note
  }
}

const noteService = new NoteService()
export default noteService
