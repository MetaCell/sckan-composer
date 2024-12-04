import { createSlice } from "@reduxjs/toolkit";
import { ROWS_PER_PAGE } from "../settings";
import {ComposerConnectivityStatementListStateEnum} from "../apiclient/backend";

export interface QueryParams {
  knowledgeStatement: string | undefined;
  limit: number;
  notes: boolean | undefined;
  index: number | undefined;
  ordering: Array<"-last_edited" | "-id" | "last_edited" | "id"> | undefined;
  stateFilter: ComposerConnectivityStatementListStateEnum[] | undefined;
  tagFilter: number[] | undefined;
  sentenceId: number | undefined;
  excludeSentenceId: number | undefined;
  excludeIds: number[] | undefined;
  origins: number[] | undefined;
}

export interface StatementState {
  queryOptions: QueryParams;
  wasChangeDetected: boolean;
  positionChangeOnly: boolean;
}

export const initialState: StatementState = {
  queryOptions: {
    limit: ROWS_PER_PAGE,
    notes: undefined,
    index: undefined,
    ordering: undefined,
    stateFilter: undefined,
    tagFilter: undefined,
    knowledgeStatement: undefined,
    sentenceId: undefined,
    excludeSentenceId: undefined,
    excludeIds: undefined,
    origins: undefined,
  },
  wasChangeDetected: false,
  positionChangeOnly: false,
};

export const statementSlice = createSlice({
  name: "statement",
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.queryOptions.stateFilter = action.payload.stateFilter;
      state.queryOptions.tagFilter = action.payload.tagFilter;
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
  },
});

export const { setFilters, setSorting, setKnowledgeStatementQuery, setIndex, setWasChangeDetected, setPositionChangeOnly } =
  statementSlice.actions;

export default statementSlice.reducer;
