import { configureStore } from '@reduxjs/toolkit'
import sentenceReducer from './sentenceSlice'
import statementReducer from './statementSlice'
import notesReducer from './notesSlice'

export const store = configureStore({
  reducer: {
    sentence: sentenceReducer,
    statement: statementReducer,
    notes: notesReducer
  },
})

export type AppDispatch = typeof store.dispatch
export type RootState = ReturnType<typeof store.getState>
