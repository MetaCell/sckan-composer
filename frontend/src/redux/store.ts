import { configureStore } from '@reduxjs/toolkit'
import sentenceReducer from './sentenceSlice'
import statementReducer from './statementSlice'

export const store = configureStore({
  reducer: {
    sentence: sentenceReducer,
    statement: statementReducer
  },
})

export type AppDispatch = typeof store.dispatch
export type RootState = ReturnType<typeof store.getState>