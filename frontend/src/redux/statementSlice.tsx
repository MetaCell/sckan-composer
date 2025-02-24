import { createSlice } from "@reduxjs/toolkit";
import { ROWS_PER_PAGE } from "../settings";
import {ComposerConnectivityStatementListStateEnum} from "../apiclient/backend";

export interface QueryParams {
  knowledgeStatement: string | undefined;
  limit: number;
  notes: boolean | undefined;
  hasStatementBeenExportedFilter?: boolean | undefined;
  index: number | undefined;
  ordering: Array<"-last_edited" | "-id" | "last_edited" | "id"> | undefined;
  stateFilter: ComposerConnectivityStatementListStateEnum[] | undefined;
  tagFilter: number[] | undefined;
  sentenceId: number | undefined;
  excludeSentenceId: number | undefined;
  excludeIds: number[] | undefined;
  include: number[] | undefined;
  origins: number[] | undefined;
}

export interface DialogsState {
  [dialogKey: string]: boolean;
}
export interface StatementState {
  queryOptions: QueryParams;
  wasChangeDetected: boolean;
  positionChangeOnly: boolean;
  isResetInvoked: boolean;
  dialogs: DialogsState;
}

export const initialState: StatementState = {
  queryOptions: {
    limit: ROWS_PER_PAGE,
    notes: undefined,
    index: undefined,
    ordering: undefined,
    hasStatementBeenExportedFilter: false,
    stateFilter: undefined,
    tagFilter: undefined,
    knowledgeStatement: undefined,
    sentenceId: undefined,
    excludeSentenceId: undefined,
    excludeIds: undefined,
    include: undefined,
    origins: undefined,
  },
  wasChangeDetected: false,
  positionChangeOnly: false,
  isResetInvoked: false,
  dialogs: {
    switchOrientation: false,
    redrawGraph: false,
    toggleGraphLock: false,
    navigate: false,
  },
};

export const statementSlice = createSlice({
  name: "statement",
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.queryOptions.stateFilter = action.payload.stateFilter;
      state.queryOptions.tagFilter = action.payload.tagFilter;
      state.queryOptions.hasStatementBeenExportedFilter = action.payload.hasStatementBeenExportedFilter;
      state.queryOptions.index = 0;
    },
    setSorting: (state, action) => {
      state.queryOptions.ordering = action.payload;
      state.queryOptions.index = 0;
    },
    setKnowledgeStatementQuery: (state, action) => {
      state.queryOptions.knowledgeStatement = action.payload;
      state.queryOptions.index = 0;
    },
    setIndex: (state, action) => {
      state.queryOptions.index = action.payload;
    },
    setPositionChangeOnly(state, action) {
      state.positionChangeOnly = action.payload;
    },
    setWasChangeDetected(state, action) {
      state.wasChangeDetected = action.payload;
      if (action.payload) {
        state.positionChangeOnly = false; // Reset when other changes occur
      }
    },
    setIsResetInvoked(state, action) {
      state.isResetInvoked = action.payload;
    },
    setDialogState: (state, action) => {
      const { dialogKey, dontShow } = action.payload;
      state.dialogs[dialogKey] = dontShow;
    },
  },
});

export const { setFilters, setSorting, setKnowledgeStatementQuery, setIndex, setWasChangeDetected, setPositionChangeOnly, setDialogState, setIsResetInvoked } =
  statementSlice.actions;

export default statementSlice.reducer;
