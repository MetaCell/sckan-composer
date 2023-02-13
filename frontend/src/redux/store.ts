import { configureStore } from '@reduxjs/toolkit'
import sentenceReducer from './sentenceSlice'

export const store = configureStore({
  reducer: {
    sentence: sentenceReducer,
  },
})

export type AppDispatch = typeof store.dispatch
export type RootState = ReturnType<typeof store.getState>