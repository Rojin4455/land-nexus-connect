import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Helper function to check if error message is readable
const isReadableError = (error: any): boolean => {
  return typeof error === 'string' && error.trim().length > 0 && error.length < 500;
};

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
  email: string;
  phone: string;
}

interface AdminLoginCredentials {
  username: string;
  password: string;
}

interface SignupData {
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
}

interface OTPVerificationData {
  username: string;
  otp: string;
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
        if (errorData.detail && isReadableError(errorData.detail)) return rejectWithValue(errorData.detail);
        if (errorData.message && isReadableError(errorData.message)) return rejectWithValue(errorData.message);
        if (errorData.error && isReadableError(errorData.error)) return rejectWithValue(errorData.error);
        if (isReadableError(errorData)) return rejectWithValue(errorData);
        // Handle field-specific errors
        if (errorData.username && Array.isArray(errorData.username) && isReadableError(errorData.username[0])) return rejectWithValue(`Username: ${errorData.username[0]}`);
        if (errorData.password && Array.isArray(errorData.password) && isReadableError(errorData.password[0])) return rejectWithValue(`Password: ${errorData.password[0]}`);
        if (errorData.non_field_errors && Array.isArray(errorData.non_field_errors) && isReadableError(errorData.non_field_errors[0])) return rejectWithValue(errorData.non_field_errors[0]);
      }
      return rejectWithValue('Invalid credentials. Please check your username and password.');
    }
  }
);

// Admin Login
export const loginAdmin = createAsyncThunk(
  'auth/loginAdmin',
  async (credentials: AdminLoginCredentials, { rejectWithValue }) => {
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
        if (errorData.detail && isReadableError(errorData.detail)) return rejectWithValue(errorData.detail);
        if (errorData.message && isReadableError(errorData.message)) return rejectWithValue(errorData.message);
        if (errorData.error && isReadableError(errorData.error)) return rejectWithValue(errorData.error);
        if (isReadableError(errorData)) return rejectWithValue(errorData);
        // Handle field-specific errors
        if (errorData.username && Array.isArray(errorData.username) && isReadableError(errorData.username[0])) return rejectWithValue(`Username: ${errorData.username[0]}`);
        if (errorData.password && Array.isArray(errorData.password) && isReadableError(errorData.password[0])) return rejectWithValue(`Password: ${errorData.password[0]}`);
        if (errorData.non_field_errors && Array.isArray(errorData.non_field_errors) && isReadableError(errorData.non_field_errors[0])) return rejectWithValue(errorData.non_field_errors[0]);
      }
      return rejectWithValue('Invalid admin credentials. Please verify your access level.');
    }
  }
);

// Request Signup OTP
export const requestSignupOTP = createAsyncThunk(
  'auth/requestSignupOTP',
  async (signupData: SignupData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/signup/`, signupData);
      return response.data;
    } catch (error: any) {
      console.error('Request OTP error:', error.response?.data);
      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.detail && isReadableError(errorData.detail)) return rejectWithValue(errorData.detail);
        if (errorData.message && isReadableError(errorData.message)) return rejectWithValue(errorData.message);
        if (errorData.error && isReadableError(errorData.error)) return rejectWithValue(errorData.error);
        if (isReadableError(errorData)) return rejectWithValue(errorData);
        // Handle field-specific errors
        if (errorData.username) {
          const usernameError = Array.isArray(errorData.username) ? errorData.username[0] : errorData.username;
          if (isReadableError(usernameError)) return rejectWithValue(`Username: ${usernameError}`);
        }
        if (errorData.email) {
          const emailError = Array.isArray(errorData.email) ? errorData.email[0] : errorData.email;
          if (isReadableError(emailError)) return rejectWithValue(`Email: ${emailError}`);
        }
        if (errorData.phone) {
          const phoneError = Array.isArray(errorData.phone) ? errorData.phone[0] : errorData.phone;
          if (isReadableError(phoneError)) return rejectWithValue(`Phone: ${phoneError}`);
        }
      }
      return rejectWithValue('Failed to send OTP. Please check your information and try again.');
    }
  }
);

// Verify Signup OTP
export const verifySignupOTP = createAsyncThunk(
  'auth/verifySignupOTP',
  async (otpData: OTPVerificationData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/signup-verify-otp/`, otpData);
      return response.data as AuthResponse;
    } catch (error: any) {
      console.error('Verify OTP error:', error.response?.data);
      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.detail && isReadableError(errorData.detail)) return rejectWithValue(errorData.detail);
        if (errorData.message && isReadableError(errorData.message)) return rejectWithValue(errorData.message);
        if (errorData.error && isReadableError(errorData.error)) return rejectWithValue(errorData.error);
        if (isReadableError(errorData)) return rejectWithValue(errorData);
      }
      return rejectWithValue('Invalid OTP. Please try again.');
    }
  }
);

// Request Login OTP
export const requestLoginOTP = createAsyncThunk(
  'auth/requestLoginOTP',
  async (loginData: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login/`, loginData);
      return response.data;
    } catch (error: any) {
      console.error('Request Login OTP error:', error.response?.data);
      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.detail && isReadableError(errorData.detail)) return rejectWithValue(errorData.detail);
        if (errorData.message && isReadableError(errorData.message)) return rejectWithValue(errorData.message);
        if (errorData.error && isReadableError(errorData.error)) return rejectWithValue(errorData.error);
        if (isReadableError(errorData)) return rejectWithValue(errorData);
        // Handle field-specific errors
        if (errorData.email) {
          const emailError = Array.isArray(errorData.email) ? errorData.email[0] : errorData.email;
          if (isReadableError(emailError)) return rejectWithValue(`Email: ${emailError}`);
        }
        if (errorData.phone) {
          const phoneError = Array.isArray(errorData.phone) ? errorData.phone[0] : errorData.phone;
          if (isReadableError(phoneError)) return rejectWithValue(`Phone: ${phoneError}`);
        }
      }
      return rejectWithValue('Failed to send login OTP. Please check your information and try again.');
    }
  }
);

// Verify Login OTP
export const verifyLoginOTP = createAsyncThunk(
  'auth/verifyLoginOTP',
  async (otpData: { email: string; otp: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login-verify-otp/`, otpData);
      console.log('✅ Login OTP Response:', response.data);
      console.log('🔑 Access token:', response.data.access);
      console.log('🔑 Refresh token:', response.data.refresh);
      console.log('👤 User:', response.data.user);
      return response.data as AuthResponse;
    } catch (error: any) {
      console.error('Verify Login OTP error:', error.response?.data);
      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.detail && isReadableError(errorData.detail)) return rejectWithValue(errorData.detail);
        if (errorData.message && isReadableError(errorData.message)) return rejectWithValue(errorData.message);
        if (errorData.error && isReadableError(errorData.error)) return rejectWithValue(errorData.error);
        if (isReadableError(errorData)) return rejectWithValue(errorData);
      }
      return rejectWithValue('Invalid OTP. Please try again.');
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

    // Request Signup OTP
    builder
      .addCase(requestSignupOTP.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(requestSignupOTP.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(requestSignupOTP.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Verify Signup OTP
    builder
      .addCase(verifySignupOTP.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifySignupOTP.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.access;
        state.refreshToken = action.payload.refresh;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(verifySignupOTP.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // Request Login OTP
    builder
      .addCase(requestLoginOTP.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(requestLoginOTP.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(requestLoginOTP.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Verify Login OTP
    builder
      .addCase(verifyLoginOTP.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyLoginOTP.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.access;
        state.refreshToken = action.payload.refresh;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(verifyLoginOTP.rejected, (state, action) => {
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