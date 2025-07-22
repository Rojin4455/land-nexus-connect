import axios from 'axios';

// Configure base API instance
const api = axios.create({
  baseURL: import.meta.env.REACT_APP_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests if available
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
    token = localStorage.getItem('authToken') || localStorage.getItem('adminToken') || localStorage.getItem('userToken');
  }
  
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
  utilities?: string; // Single ID as string to match backend
  accessType?: string;
  estimatedAEV?: string;
  developmentCosts?: string;
  topography?: string;
  environmentalFactors?: string;
  nearestAttraction?: string;
  files?: File[]; // Combined files array for backend
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
    
    // Append fields with correct types as per backend requirements
    if (dealData.address) formData.append('address', dealData.address);
    if (dealData.landType) formData.append('landType', dealData.landType);
    if (dealData.acreage) formData.append('acreage', dealData.acreage.toString());
    if (dealData.zoning) formData.append('zoning', dealData.zoning);
    if (dealData.askingPrice) formData.append('askingPrice', dealData.askingPrice.toString());
    if (dealData.estimatedAEV) formData.append('estimatedAEV', dealData.estimatedAEV);
    if (dealData.developmentCosts) formData.append('developmentCosts', dealData.developmentCosts);
    if (dealData.utilities) formData.append('utilities', dealData.utilities);
    if (dealData.accessType) formData.append('accessType', dealData.accessType);
    if (dealData.topography) formData.append('topography', dealData.topography);
    if (dealData.environmentalFactors) formData.append('environmentalFactors', dealData.environmentalFactors);
    if (dealData.nearestAttraction) formData.append('nearestAttraction', dealData.nearestAttraction);
    if (dealData.description) formData.append('description', dealData.description);
    
    // Handle file uploads
    if (dealData.files && Array.isArray(dealData.files)) {
      dealData.files.forEach((file) => {
        formData.append('files', file);
      });
    }


    const response = await api.post('/data/properties/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },

  // Fetch all land deals for the current user
  getUserLandDeals: async (): Promise<ApiResponse<LandDeal[]>> => {
    const response = await api.get('/auth/properties/list/');
    // Transform the response to match our interface
    const transformedData = response.data.map((property: any) => ({
      id: property.id.toString(),
      address: property.address,
      submittedOn: property.created_at,
      status: property.status,
      coach: 'Assigned Coach', // Default value since not in response
      askingPrice: parseFloat(property.asking_price),
      landType: property.land_type_name,
      acreage: parseFloat(property.acreage),
      totalFilesCount: property.total_files_count
    }));
    
    return {
      success: true,
      data: transformedData
    };
  },

  // Fetch details of a specific land deal
  getLandDealById: async (dealId: string): Promise<ApiResponse<LandDeal>> => {
    const response = await api.get(`/auth/properties/${dealId}/`);
    // Transform the response to match our interface
    const property = response.data;
    const transformedData = {
      id: property.id.toString(),
      address: property.address,
      submittedOn: property.created_at,
      status: property.status,
      coach: 'Assigned Coach', // Default value since not in response
      askingPrice: parseFloat(property.asking_price),
      landType: property.land_type_detail?.display_name || property.land_type_name,
      acreage: parseFloat(property.acreage),
      zoning: property.zoning,
      utilities: property.utilities_detail?.display_name ? [property.utilities_detail.display_name] : [],
      photos: property.files?.filter((f: any) => f.file_type === 'image')?.map((f: any) => f.file_url) || [],
      documents: property.files?.filter((f: any) => f.file_type !== 'image')?.map((f: any) => f.file_url) || [],
      description: property.description,
      estimatedAEV: property.estimated_aev,
      developmentCosts: property.development_costs,
      topography: property.topography,
      environmentalFactors: property.environmental_factors,
      nearestAttraction: property.nearest_attraction,
      accessType: property.access_type_detail?.display_name,
      files: property.files || []
    };
    
    return {
      success: true,
      data: transformedData
    };
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
    const response = await api.delete(`/auth/properties/${dealId}/delete/`);
    return {
      success: true,
      data: { id: dealId }
    };
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

  // Get form options (utilities, access types, land types)
  getFormOptions: async (): Promise<ApiResponse<{
    landTypes: Array<{ value: string; label: string }>;
    utilities: Array<{ value: string; label: string }>;
    accessTypes: Array<{ value: string; label: string }>;
  }>> => {
    try {
      const response = await api.get('/land-deals/form-options');
      return response.data;
    } catch (error) {
      // Fallback to localStorage if API is not available
      const savedOptions = localStorage.getItem('formOptions');
      if (savedOptions) {
        return {
          success: true,
          data: JSON.parse(savedOptions)
        };
      }
      throw error;
    }
  },

  // Admin functions to manage form options
  admin: {
    // Get all form options
    getFormOptions: async (): Promise<ApiResponse<{
      landTypes: Array<{ value: string; label: string }>;
      utilities: Array<{ value: string; label: string }>;
      accessTypes: Array<{ value: string; label: string }>;
    }>> => {
      const response = await api.get('/admin/form-options');
      return response.data;
    },

    // Create new form option
    createFormOption: async (type: 'landTypes' | 'utilities' | 'accessTypes', data: { value: string; label: string }): Promise<ApiResponse<{ value: string; label: string }>> => {
      const response = await api.post(`/admin/form-options/${type}`, data);
      return response.data;
    },

    // Update form option
    updateFormOption: async (type: 'landTypes' | 'utilities' | 'accessTypes', optionId: string, data: { value: string; label: string }): Promise<ApiResponse<{ value: string; label: string }>> => {
      const response = await api.put(`/admin/form-options/${type}/${optionId}`, data);
      return response.data;
    },

    // Delete form option
    deleteFormOption: async (type: 'landTypes' | 'utilities' | 'accessTypes', optionId: string): Promise<ApiResponse<{ id: string }>> => {
      const response = await api.delete(`/admin/form-options/${type}/${optionId}`);
      return response.data;
    },
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