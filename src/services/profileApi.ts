import axios from 'axios';
import { store } from '@/store';

// Configure base API instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://app.jvdealhub.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  let token = null;

  // First try to get token from Redux store (most current)
  try {
    const state = store.getState();
    token = state.auth?.accessToken;
  } catch (error) {
    console.warn('Failed to get token from Redux store');
  }

  // Fallback to persisted state in localStorage
  if (!token) {
    const persistedState = localStorage.getItem('persist:root');
    if (persistedState) {
      try {
        const parsed = JSON.parse(persistedState);
        const authData = JSON.parse(parsed.auth);
        token = authData?.accessToken;
      } catch (error) {
        console.warn('Failed to parse persisted auth state');
      }
    }
  }
  
  // Final fallback to direct localStorage tokens
  if (!token) {
    token = localStorage.getItem('authToken') || localStorage.getItem('userToken');
  }
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Types
export interface UserProfile {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  llc_name: string;
  phone: string;
}

export interface CreateProfileData {
  first_name: string;
  last_name: string;
  email: string;
  llc_name: string;
  phone: string;
}

export interface UpdateProfileData {
  first_name?: string;
  last_name?: string;
  email?: string;
  llc_name?: string;
  phone?: string;
}

// API Functions
export const profileApi = {
  // Get user profile
  getProfile: async (): Promise<UserProfile> => {
    const response = await api.get('/auth/profile/');
    return response.data;
  },

  // Create new profile
  createProfile: async (data: CreateProfileData): Promise<UserProfile> => {
    const response = await api.post('/auth/profile/', data);
    return response.data;
  },

  // Update profile (full update)
  updateProfile: async (data: CreateProfileData): Promise<UserProfile> => {
    const response = await api.put('/auth/profile/', data);
    return response.data;
  },

  // Partial update profile
  patchProfile: async (data: UpdateProfileData): Promise<UserProfile> => {
    const response = await api.patch('/auth/profile/', data);
    return response.data;
  },
};
