import axios from 'axios';

// Configure base API instance for form options
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  // Check Redux store first, then fallback to localStorage
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
  
  // Fallback to localStorage tokens
  if (!token) {
    token = localStorage.getItem('adminToken') || localStorage.getItem('userToken');
  }
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for automatic token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Get refresh token from Redux store
        const persistedState = localStorage.getItem('persist:root');
        let refreshToken = null;
        
        if (persistedState) {
          try {
            const parsed = JSON.parse(persistedState);
            const authData = JSON.parse(parsed.auth);
            refreshToken = authData?.refreshToken;
          } catch (parseError) {
            console.warn('Failed to parse persisted auth state for refresh');
          }
        }
        
        if (refreshToken) {
          // Call refresh token API
          const refreshResponse = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/auth/token/refresh/`, {
            refresh: refreshToken
          });
          
          const newAccessToken = refreshResponse.data.access;
          
          // Update the persisted state with new token
          if (persistedState) {
            try {
              const parsed = JSON.parse(persistedState);
              const authData = JSON.parse(parsed.auth);
              authData.accessToken = newAccessToken;
              parsed.auth = JSON.stringify(authData);
              localStorage.setItem('persist:root', JSON.stringify(parsed));
            } catch (updateError) {
              console.warn('Failed to update persisted auth state');
            }
          }
          
          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        console.warn('Token refresh failed:', refreshError);
        // Clear persisted state
        localStorage.removeItem('persist:root');
        // Redirect to login page
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Types
export interface FormOption {
  id: number;
  value: string;
  display_name: string;
  created_at: string;
  updated_at: string;
}

export interface CreateFormOptionData {
  value: string;
  display_name: string;
}

export interface FormOptionsResponse {
  utilities: FormOption[];
  landTypes: FormOption[];
  accessTypes: FormOption[];
}

// API Functions
export const formOptionsApi = {
  // Get all utilities
  getUtilities: async (): Promise<FormOption[]> => {
    const response = await api.get('/auth/utilities/');
    return response.data;
  },

  // Create new utility
  createUtility: async (data: CreateFormOptionData): Promise<FormOption> => {
    const response = await api.post('/auth/utilities/', data);
    return response.data.data;
  },

  // Get all land types
  getLandTypes: async (): Promise<FormOption[]> => {
    const response = await api.get('/auth/land-types/');
    return response.data;
  },

  // Create new land type
  createLandType: async (data: CreateFormOptionData): Promise<FormOption> => {
    const response = await api.post('/auth/land-types/', data);
    return response.data.data;
  },

  // Get all access types
  getAccessTypes: async (): Promise<FormOption[]> => {
    const response = await api.get('/auth/access-types/');
    return response.data;
  },

  // Create new access type
  createAccessType: async (data: CreateFormOptionData): Promise<FormOption> => {
    const response = await api.post('/auth/access-types/', data);
    return response.data.data;
  },

  // Update utility
  updateUtility: async (id: number, data: CreateFormOptionData): Promise<FormOption> => {
    const response = await api.put(`/auth/utilities/${id}/`, data);
    return response.data.data;
  },

  // Delete utility
  deleteUtility: async (id: number): Promise<void> => {
    await api.delete(`/auth/utilities/${id}/`);
  },

  // Update land type
  updateLandType: async (id: number, data: CreateFormOptionData): Promise<FormOption> => {
    const response = await api.put(`/auth/land-types/${id}/`, data);
    return response.data.data;
  },

  // Delete land type
  deleteLandType: async (id: number): Promise<void> => {
    await api.delete(`/auth/land-types/${id}/`);
  },

  // Update access type
  updateAccessType: async (id: number, data: CreateFormOptionData): Promise<FormOption> => {
    const response = await api.put(`/auth/access-types/${id}/`, data);
    return response.data.data;
  },

  // Delete access type
  deleteAccessType: async (id: number): Promise<void> => {
    await api.delete(`/auth/access-types/${id}/`);
  },

  // Get all form options at once
  getAllFormOptions: async (): Promise<FormOptionsResponse> => {
    const [utilities, landTypes, accessTypes] = await Promise.all([
      formOptionsApi.getUtilities(),
      formOptionsApi.getLandTypes(),
      formOptionsApi.getAccessTypes(),
    ]);

    return {
      utilities,
      landTypes,
      accessTypes,
    };
  },
};

// Transform API data to format expected by forms
export const transformFormOptionsForSelect = (options: FormOption[]) => {
  return options.map(option => ({
    value: option.id.toString(), // Use ID as value for backend mapping
    label: option.display_name,
  }));
};

export default formOptionsApi;