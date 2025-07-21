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

// Update thunks
export const updateUtility = createAsyncThunk(
  'formOptions/updateUtility',
  async ({ id, data }: { id: number; data: CreateFormOptionData }, { rejectWithValue }) => {
    try {
      const utility = await formOptionsApi.updateUtility(id, data);
      return { id, utility };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to update utility');
    }
  }
);

export const updateLandType = createAsyncThunk(
  'formOptions/updateLandType',
  async ({ id, data }: { id: number; data: CreateFormOptionData }, { rejectWithValue }) => {
    try {
      const landType = await formOptionsApi.updateLandType(id, data);
      return { id, landType };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to update land type');
    }
  }
);

export const updateAccessType = createAsyncThunk(
  'formOptions/updateAccessType',
  async ({ id, data }: { id: number; data: CreateFormOptionData }, { rejectWithValue }) => {
    try {
      const accessType = await formOptionsApi.updateAccessType(id, data);
      return { id, accessType };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to update access type');
    }
  }
);

// Delete thunks
export const deleteUtility = createAsyncThunk(
  'formOptions/deleteUtility',
  async (id: number, { rejectWithValue }) => {
    try {
      await formOptionsApi.deleteUtility(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to delete utility');
    }
  }
);

export const deleteLandType = createAsyncThunk(
  'formOptions/deleteLandType',
  async (id: number, { rejectWithValue }) => {
    try {
      await formOptionsApi.deleteLandType(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to delete land type');
    }
  }
);

export const deleteAccessType = createAsyncThunk(
  'formOptions/deleteAccessType',
  async (id: number, { rejectWithValue }) => {
    try {
      await formOptionsApi.deleteAccessType(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to delete access type');
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
      })
      
      // Update utility
      .addCase(updateUtility.fulfilled, (state, action) => {
        const index = state.utilities.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.utilities[index] = action.payload.utility;
        }
      })
      .addCase(updateUtility.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // Update land type
      .addCase(updateLandType.fulfilled, (state, action) => {
        const index = state.landTypes.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.landTypes[index] = action.payload.landType;
        }
      })
      .addCase(updateLandType.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // Update access type
      .addCase(updateAccessType.fulfilled, (state, action) => {
        const index = state.accessTypes.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.accessTypes[index] = action.payload.accessType;
        }
      })
      .addCase(updateAccessType.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // Delete utility
      .addCase(deleteUtility.fulfilled, (state, action) => {
        state.utilities = state.utilities.filter(item => item.id !== action.payload);
      })
      .addCase(deleteUtility.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // Delete land type
      .addCase(deleteLandType.fulfilled, (state, action) => {
        state.landTypes = state.landTypes.filter(item => item.id !== action.payload);
      })
      .addCase(deleteLandType.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // Delete access type
      .addCase(deleteAccessType.fulfilled, (state, action) => {
        state.accessTypes = state.accessTypes.filter(item => item.id !== action.payload);
      })
      .addCase(deleteAccessType.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = formOptionsSlice.actions;
export default formOptionsSlice.reducer;