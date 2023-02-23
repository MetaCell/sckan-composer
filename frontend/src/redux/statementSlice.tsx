import { createSlice } from "@reduxjs/toolkit";
import { ROWS_PER_PAGE } from "../settings";

export type StateFilter = Array<
  | "approved"
  | "compose_now"
  | "connection_missing"
  | "curated"
  | "draft"
  | "excluded"
  | "npo_approved"
  | "rejected"
  | "to_be_reviewed"
>;

export interface QueryParams {
  knowledgeStatement: string | undefined;
  limit: number;
  notes: boolean | undefined;
  index: number | undefined;
  ordering:
    | Array<"-last_edited" | "-pmid" | "last_edited" | "pmid">
    | undefined;
  stateFilter: StateFilter | undefined;
  tagFilter: number[] | undefined;
}

export interface StatementState {
  queryOptions: QueryParams;
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
  },
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
  },
});

export const { setFilters, setSorting, setKnowledgeStatementQuery, setIndex } =
  statementSlice.actions;

export default statementSlice.reducer;
