import { createSlice } from '@reduxjs/toolkit'
import { ROWS_PER_PAGE } from '../settings'
import {ComposerSentenceListStateEnum} from "../apiclient/backend";

export interface QueryParams {
  limit: number,
  notes: boolean | undefined,
  index: number | undefined,
  ordering: Array<'-last_edited' | '-id' | 'last_edited' | 'id' | 'owner' | '-owner'> | undefined,
  stateFilter: ComposerSentenceListStateEnum[] | undefined,
  populationSetFilter: number[] | undefined,
  tagFilter: number[] | undefined,
  title: string | undefined
  exclude: string[] | undefined
  include: number[] | undefined
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
    populationSetFilter: undefined,
    tagFilter: undefined,
    title: undefined,
    exclude: undefined,
    include: undefined
  }
}


export const sentenceSlice = createSlice({
  name: 'sentence',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.queryOptions.stateFilter = action.payload.stateFilter
      state.queryOptions.tagFilter = action.payload.tagFilter
      state.queryOptions.populationSetFilter = action.payload.populationSetFilter
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
