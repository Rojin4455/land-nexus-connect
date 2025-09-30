import axios from 'axios';

// Configure base API instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://app.jvdealhub.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const persistedState = localStorage.getItem('persist:root');
  let token = null;

  if (persistedState) {
    try {
      const parsed = JSON.parse(persistedState);
      const authData = JSON.parse(parsed.auth);
      token = authData?.accessToken;
    } catch (error) {
      console.warn('Failed to parse persisted auth state');
    }
  }
  
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
    const response = await api.get('/profile/');
    return response.data;
  },

  // Create new profile
  createProfile: async (data: CreateProfileData): Promise<UserProfile> => {
    const response = await api.post('/profile/', data);
    return response.data;
  },

  // Update profile (full update)
  updateProfile: async (data: CreateProfileData): Promise<UserProfile> => {
    const response = await api.put('/profile/', data);
    return response.data;
  },

  // Partial update profile
  patchProfile: async (data: UpdateProfileData): Promise<UserProfile> => {
    const response = await api.patch('/profile/', data);
    return response.data;
  },
};
