import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { formOptionsApi, FormOption, CreateFormOptionData } from '@/services/formOptionsApi';

interface FormOptionsState {
  utilities: FormOption[];
  landTypes: FormOption[];
  accessTypes: FormOption[];
  loading: boolean;
  error: string | null;
}

const initialState: FormOptionsState = {
  utilities: [],
  landTypes: [],
  accessTypes: [],
  loading: false,
  error: null,
};

// Async thunks
export const fetchAllFormOptions = createAsyncThunk(
  'formOptions/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const data = await formOptionsApi.getAllFormOptions();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch form options');
    }
  }
);

export const createUtility = createAsyncThunk(
  'formOptions/createUtility',
  async (data: CreateFormOptionData, { rejectWithValue }) => {
    try {
      const utility = await formOptionsApi.createUtility(data);
      return utility;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to create utility');
    }
  }
);

export const createLandType = createAsyncThunk(
  'formOptions/createLandType',
  async (data: CreateFormOptionData, { rejectWithValue }) => {
    try {
      const landType = await formOptionsApi.createLandType(data);
      return landType;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to create land type');
    }
  }
);

export const createAccessType = createAsyncThunk(
  'formOptions/createAccessType',
  async (data: CreateFormOptionData, { rejectWithValue }) => {
    try {
      const accessType = await formOptionsApi.createAccessType(data);
      return accessType;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to create access type');
    }
  }
);

const formOptionsSlice = createSlice({
  name: 'formOptions',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all form options
      .addCase(fetchAllFormOptions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllFormOptions.fulfilled, (state, action) => {
        state.loading = false;
        state.utilities = action.payload.utilities;
        state.landTypes = action.payload.landTypes;
        state.accessTypes = action.payload.accessTypes;
      })
      .addCase(fetchAllFormOptions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Create utility
      .addCase(createUtility.fulfilled, (state, action) => {
        state.utilities.push(action.payload);
      })
      .addCase(createUtility.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // Create land type
      .addCase(createLandType.fulfilled, (state, action) => {
        state.landTypes.push(action.payload);
      })
      .addCase(createLandType.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // Create access type
      .addCase(createAccessType.fulfilled, (state, action) => {
        state.accessTypes.push(action.payload);
      })
      .addCase(createAccessType.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = formOptionsSlice.actions;
export default formOptionsSlice.reducer;