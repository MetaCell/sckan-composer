import { createSlice } from '@reduxjs/toolkit'

export interface QueryParams {
  count: number,
}

export const initialState: QueryParams = {
  count: 0
}


export const notesSlice = createSlice({
  name: 'notes',
  initialState,
  reducers: {
    setCount: (state, action) => {
      console.log('lskss')
      state.count = action.payload.count
    },
  },
})

export const { setCount } = notesSlice.actions;

export default notesSlice.reducer;
