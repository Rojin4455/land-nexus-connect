import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_staff?: boolean;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

interface LoginCredentials {
  username: string;
  password: string;
}

interface SignupData {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
}

interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
};

// User Login
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login/`, credentials);
      
      // Transform the response to match our expected AuthResponse interface
      const transformedResponse: AuthResponse = {
        access: response.data.tokens.access,
        refresh: response.data.tokens.refresh,
        user: response.data.user
      };
      
      return transformedResponse;
    } catch (error: any) {
      // Extract specific error message from API response
      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.detail) return rejectWithValue(errorData.detail);
        if (errorData.message) return rejectWithValue(errorData.message);
        if (errorData.error) return rejectWithValue(errorData.error);
        if (typeof errorData === 'string') return rejectWithValue(errorData);
        // Handle field-specific errors
        if (errorData.username) return rejectWithValue(`Username: ${errorData.username[0]}`);
        if (errorData.password) return rejectWithValue(`Password: ${errorData.password[0]}`);
        if (errorData.non_field_errors) return rejectWithValue(errorData.non_field_errors[0]);
      }
      return rejectWithValue(error.message || 'Invalid credentials. Please check your username and password.');
    }
  }
);

// Admin Login
export const loginAdmin = createAsyncThunk(
  'auth/loginAdmin',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      console.log('AuthSlice - Making admin login request to:', `${API_BASE_URL}/auth/admin/login/`);
      const response = await axios.post(`${API_BASE_URL}/auth/admin/login/`, credentials);
      console.log('AuthSlice - Admin login response:', response.data);
      
      // Transform the response to match our expected AuthResponse interface
      const transformedResponse: AuthResponse = {
        access: response.data.tokens.access,
        refresh: response.data.tokens.refresh,
        user: response.data.admin
      };
      
      console.log('AuthSlice - Transformed admin response:', transformedResponse);
      return transformedResponse;
    } catch (error: any) {
      console.error('AuthSlice - Admin login error:', error);
      // Extract specific error message from API response
      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.detail) return rejectWithValue(errorData.detail);
        if (errorData.message) return rejectWithValue(errorData.message);
        if (errorData.error) return rejectWithValue(errorData.error);
        if (typeof errorData === 'string') return rejectWithValue(errorData);
        // Handle field-specific errors
        if (errorData.username) return rejectWithValue(`Username: ${errorData.username[0]}`);
        if (errorData.password) return rejectWithValue(`Password: ${errorData.password[0]}`);
        if (errorData.non_field_errors) return rejectWithValue(errorData.non_field_errors[0]);
      }
      return rejectWithValue(error.message || 'Invalid admin credentials. Please verify your access level.');
    }
  }
);

// User Signup
export const signupUser = createAsyncThunk(
  'auth/signupUser',
  async (signupData: SignupData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/signup/`, signupData);
      return response.data as AuthResponse;
    } catch (error: any) {
      console.error('Signup error:', error.response?.data);
      // Extract specific error message from API response
      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.detail) return rejectWithValue(errorData.detail);
        if (errorData.message) return rejectWithValue(errorData.message);
        if (errorData.error) return rejectWithValue(errorData.error);
        if (typeof errorData === 'string') return rejectWithValue(errorData);
        // Handle field-specific errors
        if (errorData.username) return rejectWithValue(`Username: ${Array.isArray(errorData.username) ? errorData.username[0] : errorData.username}`);
        if (errorData.email) return rejectWithValue(`Email: ${Array.isArray(errorData.email) ? errorData.email[0] : errorData.email}`);
        if (errorData.password) return rejectWithValue(`Password: ${Array.isArray(errorData.password) ? errorData.password[0] : errorData.password}`);
        if (errorData.phone) return rejectWithValue(`Phone: ${Array.isArray(errorData.phone) ? errorData.phone[0] : errorData.phone}`);
        if (errorData.non_field_errors) return rejectWithValue(Array.isArray(errorData.non_field_errors) ? errorData.non_field_errors[0] : errorData.non_field_errors);
      }
      return rejectWithValue(error.message || 'Account creation failed. Please check your information and try again.');
    }
  }
);

// Refresh Token
export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState };
      const refresh = state.auth.refreshToken;
      
      if (!refresh) {
        return rejectWithValue('No refresh token available');
      }

      const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
        refresh,
      });
      
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Token refresh failed');
    }
  }
);

// Get User Profile
export const getUserProfile = createAsyncThunk(
  'auth/getUserProfile',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState };
      const token = state.auth.accessToken;
      
      const response = await axios.get(`${API_BASE_URL}/auth/profile/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get profile');
    }
  }
);

// Logout User
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState };
      const { accessToken, refreshToken } = state.auth;

      if (!accessToken || !refreshToken) {
        return;
      }

      await axios.post(`${API_BASE_URL}/auth/logout/`, {
        refresh: refreshToken,
      }, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Logout failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setCredentials: (state, action: PayloadAction<AuthResponse>) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.access;
      state.refreshToken = action.payload.refresh;
      state.isAuthenticated = true;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Login User
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        console.log('User login successful:', action.payload);
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.access;
        state.refreshToken = action.payload.refresh;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // Login Admin
    builder
      .addCase(loginAdmin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        console.log('Admin login successful:', action.payload);
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.access;
        state.refreshToken = action.payload.refresh;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // Signup User
    builder
      .addCase(signupUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.access;
        state.refreshToken = action.payload.refresh;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // Refresh Token
    builder
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.accessToken = action.payload.access;
      })
      .addCase(refreshToken.rejected, (state) => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
      });

    // Get User Profile
    builder
      .addCase(getUserProfile.fulfilled, (state, action) => {
        state.user = action.payload;
      });

    // Logout User
    builder
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state) => {
        // Even if logout fails on backend, clear local state
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.error = null;
      });
  },
});

export const { logout, clearError, setCredentials } = authSlice.actions;
export default authSlice.reducer;