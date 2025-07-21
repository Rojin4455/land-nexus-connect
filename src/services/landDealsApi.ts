import axios from 'axios';

// Configure base API instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Types for API responses
export interface LandDeal {
  id: string;
  address: string;
  submittedOn: string;
  status: string;
  coach: string;
  askingPrice: number;
  landType: string;
  description?: string;
  acreage?: number;
  zoning?: string;
  utilities?: string[];
  photos?: string[];
  documents?: string[];
}

export interface CreateLandDealData {
  address: string;
  askingPrice: number;
  landType: string;
  description?: string;
  acreage?: number;
  zoning?: string;
  utilities?: string[];
  photos?: File[];
  documents?: File[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// API Functions
export const landDealsApi = {
  // Create a new land deal
  createLandDeal: async (dealData: CreateLandDealData): Promise<ApiResponse<LandDeal>> => {
    const formData = new FormData();
    
    // Append basic fields
    Object.entries(dealData).forEach(([key, value]) => {
      if (key === 'photos' || key === 'documents') {
        // Handle file uploads
        if (Array.isArray(value)) {
          value.forEach((file) => {
            formData.append(key, file);
          });
        }
      } else if (Array.isArray(value)) {
        // Handle arrays (like utilities)
        formData.append(key, JSON.stringify(value));
      } else if (value !== undefined) {
        formData.append(key, String(value));
      }
    });

    const response = await api.post('/land-deals', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },

  // Fetch all land deals for the current user
  getUserLandDeals: async (): Promise<ApiResponse<LandDeal[]>> => {
    const response = await api.get('/land-deals');
    return response.data;
  },

  // Fetch details of a specific land deal
  getLandDealById: async (dealId: string): Promise<ApiResponse<LandDeal>> => {
    const response = await api.get(`/land-deals/${dealId}`);
    return response.data;
  },

  // Update an existing land deal
  updateLandDeal: async (dealId: string, dealData: Partial<CreateLandDealData>): Promise<ApiResponse<LandDeal>> => {
    const formData = new FormData();
    
    Object.entries(dealData).forEach(([key, value]) => {
      if (key === 'photos' || key === 'documents') {
        if (Array.isArray(value)) {
          value.forEach((file) => {
            formData.append(key, file);
          });
        }
      } else if (Array.isArray(value)) {
        formData.append(key, JSON.stringify(value));
      } else if (value !== undefined) {
        formData.append(key, String(value));
      }
    });

    const response = await api.put(`/land-deals/${dealId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },

  // Delete a land deal
  deleteLandDeal: async (dealId: string): Promise<ApiResponse<{ id: string }>> => {
    const response = await api.delete(`/land-deals/${dealId}`);
    return response.data;
  },

  // Upload additional documents or photos
  uploadFiles: async (dealId: string, files: File[], type: 'photos' | 'documents'): Promise<ApiResponse<string[]>> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append(type, file);
    });

    const response = await api.post(`/land-deals/${dealId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },

  // Get land deal statistics
  getUserStats: async (): Promise<ApiResponse<{
    totalDeals: number;
    totalValue: number;
    pendingReviews: number;
    approvedDeals: number;
    rejectedDeals: number;
  }>> => {
    const response = await api.get('/land-deals/stats');
    return response.data;
  },
};

// Error handling utility
export const handleApiError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  } else if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

export default landDealsApi;