import { createSlice } from '@reduxjs/toolkit'
import { ROWS_PER_PAGE } from '../settings'

export type StateFilter = Array<'compose_later' | 'compose_now' | 'duplicate' | 'excluded' | 'open' | 'to_be_reviewed'>
export interface QueryParams {
  limit: number,
  notes: boolean | undefined,
  index: number | undefined,
  ordering: Array<'-last_edited' | '-pmid' | 'last_edited' | 'pmid'> | undefined,
  stateFilter: StateFilter | undefined,
  tagFilter: number[] | undefined,
  title: string | undefined
}

export interface SentenceState {
  queryOptions: QueryParams
}

export const initialState: SentenceState = {
  queryOptions: {
    limit: ROWS_PER_PAGE,
    notes: undefined,
    index: undefined,
    ordering: undefined,
    stateFilter: undefined,
    tagFilter: undefined,
    title: undefined
  }
}


export const sentenceSlice = createSlice({
  name: 'sentence',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.queryOptions.stateFilter = action.payload.stateFilter
      state.queryOptions.tagFilter = action.payload.tagFilter
      state.queryOptions.index = 0
    },
    setSorting: (state, action) => {
      state.queryOptions.ordering = action.payload
      state.queryOptions.index = 0
    },
    setTitleQuery: (state, action) => {
      state.queryOptions.title = action.payload
      state.queryOptions.index = 0
    },
    setIndex: (state, action) => {
      state.queryOptions.index = action.payload
    }
  },
})

export const { setFilters, setSorting, setTitleQuery, setIndex } = sentenceSlice.actions;

export default sentenceSlice.reducer;
