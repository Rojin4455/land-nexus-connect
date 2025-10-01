import axios from 'axios';

// Configure base API instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://app.jvdealhub.com/api',
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

// Types for API responses
export interface LandDeal {
  id: string;
  address: string;
  submittedOn: string;
  status: string;
  coach: string;
  agreedPrice: number;
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
  agreedPrice: number;
  latitude: string;
  longitude: string;
  place_id: string;
  landType: string;
  description?: string;
  acreage?: number;
  zoning?: string;
  utilities?: string; // Single ID as string to match backend
  accessType?: string;
  estimatedAEV?: string;
  developmentCosts?: string;
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
  createLandDeal: async (dealData: any): Promise<ApiResponse<LandDeal>> => {
    const formData = new FormData();
    
    // Append fields with correct backend field names from serializer
    if (dealData.address) formData.append('address', dealData.address);
    if (dealData.latitude) formData.append('latitude', dealData.latitude.toString());
    if (dealData.longitude) formData.append('longitude', dealData.longitude.toString());
    if (dealData.place_id) formData.append('place_id', dealData.place_id);
    if (dealData.land_type) formData.append('land_type', dealData.land_type);
    if (dealData.acreage) formData.append('acreage', dealData.acreage.toString());
    if (dealData.zoning) formData.append('zoning', dealData.zoning);
    if (dealData.agreed_price) formData.append('agreed_price', dealData.agreed_price.toString());
    if (dealData.utilities) formData.append('utilities', dealData.utilities);
    if (dealData.access_type) formData.append('access_type', dealData.access_type);
    if (dealData.description) formData.append('description', dealData.description);
    
    // Add new required fields from serializer
    if (dealData.llc_name) formData.append('llc_name', dealData.llc_name);
    if (dealData.first_name) formData.append('first_name', dealData.first_name);
    if (dealData.last_name) formData.append('last_name', dealData.last_name);
    if (dealData.phone_number) formData.append('phone_number', dealData.phone_number);
    if (dealData.email) formData.append('email', dealData.email);
    if (dealData.under_contract) formData.append('under_contract', dealData.under_contract);
    if (dealData.parcel_id) formData.append('parcel_id', dealData.parcel_id);
    if (dealData.lot_size) formData.append('lot_size', dealData.lot_size.toString());
    if (dealData.lot_size_unit) formData.append('lot_size_unit', dealData.lot_size_unit);
    if (dealData.exit_strategy) formData.append('exit_strategy', dealData.exit_strategy);
    if (dealData.extra_notes) formData.append('extra_notes', dealData.extra_notes);

    
    
    
    
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
    const response = await api.get('/data/properties/list/');
    // Transform the response to match our interface based on the actual API structure
    const transformedData = response.data.map((property: any) => ({
      id: property.property_submission_id,
      property_submission_id: property.property_submission_id,
      address: property.address,
      last_message: property.last_message,
      last_message_timestamp: property.last_message_timestamp,
      unread_count: property.unread_count,
      // Default/placeholder values for fields not in API response
      submittedOn: new Date().toISOString(),
      status: 'submitted',
      coach: 'Assigned Coach',
      agreedPrice: 0,
      landType: 'Unknown',
      acreage: 0,
      totalFilesCount: 0
    }));
    
    return {
      success: true,
      data: transformedData
    };
  },

  // Fetch details of a specific land deal
  getLandDealById: async (dealId: string): Promise<ApiResponse<LandDeal>> => {
    const response = await api.get(`/data/property-detail/${dealId}/`);
    // Transform the response to match our interface
    const property = response.data;
    const transformedData = {
      id: property.id ? property.id.toString() : property.property_submission_id?.toString(),
      property_submission_id: property.property_submission_id || property.id,
      address: property.address,
      latitude: property.latitude,
      longitude: property.longitude,
      place_id: property.place_id,
      submittedOn: property.created_at,
      status: property.status,
      coach: 'Assigned Coach', // Default value since not in response
      agreedPrice: parseFloat(property.asking_price || property.agreed_price || 0),
      landType: property.land_type_detail?.display_name || property.land_type_name,
      acreage: parseFloat(property.acreage || property.lot_size || 0),
      zoning: property.zoning,
      utilities: property.utilities_detail?.display_name ? [property.utilities_detail.display_name] : [],
      photos: property.files?.filter((f: any) => f.file_type === 'image')?.map((f: any) => f.file_url) || [],
      documents: property.files?.filter((f: any) => f.file_type !== 'image')?.map((f: any) => f.file_url) || [],
      description: property.description,
      accessType: property.access_type_detail?.display_name,
      files: property.files || [],
      // Include unread count from API response
      unread_count: property.unread_count || 0,
      last_message: property.last_message,
      last_message_timestamp: property.last_message_timestamp,
      // Contact information fields
      llc_name: property.llc_name,
      first_name: property.first_name,
      last_name: property.last_name,
      phone_number: property.phone_number,
      email: property.email,
      under_contract: property.under_contract,
      parcel_id: property.parcel_id,
      agreed_price: property.agreed_price,
      lot_size: property.lot_size,
      lot_size_unit: property.lot_size_unit,
      exit_strategy: property.exit_strategy,
      extra_notes: property.extra_notes,
      created_at: property.created_at,
      updated_at: property.updated_at,
      land_type_detail: property.land_type_detail,
      utilities_detail: property.utilities_detail,
      access_type_detail: property.access_type_detail,
      user_detail: property.user_detail,
      total_files_count: property.total_files_count,
      ghl_contact_id: property.ghl_contact_id
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
    const response = await api.delete(`/data/properties/${dealId}/delete/`);
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

  // Admin functions to manage form options and users
  admin: {
    // Get all users
    getUsers: async (): Promise<ApiResponse<Array<{
      id: number;
      username: string;
      email: string;
      first_name: string;
      last_name: string;
      date_joined: string;
      is_active: boolean;
    }>>> => {
      const response = await api.get('/auth/users/');
      return {
        success: true,
        data: response.data
      };
    },

    getBuyers: async (): Promise<ApiResponse<Array<{
      id: number;
      user_id: number;
      name: string;
      email: string;
      phone: string | null;
    }>>> => {
      const response = await api.get('/buyers/');
      return {
        success: true,
        data: response.data
      };
    },

    createBuyer: async (data: { name: string; email: string; phone: string; }): Promise<ApiResponse<{ id: number; name: string; email: string; phone: string | null }>> => {
      const response = await api.post('/buyers/create/', data);
      return {
        success: true,
        data: response.data
      };
    },

    // Get details for a specific user with their deals
    getUserDetailsWithDeals: async (userId: number): Promise<ApiResponse<any>> => {
      const response = await api.get(`/auth/users/${userId}/details/`);
      return {
        success: true,
        data: response.data
      };
    },

    // Get deals for a specific user
    getUserDeals: async (userId: number): Promise<ApiResponse<LandDeal[]>> => {
      const response = await api.get(`/data/properties/list/${userId}/`);
      const transformedData = response.data.map((property: any) => ({
        id: property.id.toString(),
        address: property.address,
        submittedOn: property.created_at,
        status: property.status,
        coach: 'Assigned Coach',
        agreedPrice: parseFloat(property.asking_price),
        landType: property.land_type_name,
        acreage: parseFloat(property.acreage),
        totalFilesCount: property.total_files_count
      }));
      
      return {
        success: true,
        data: transformedData
      };
    },

    updatePropertyDetails: async (id: string | number, data: any) => {
      return await api.patch(`/data/properties/${id}/status/`, data); // assumes `api` is your Axios instance
    },

    // Get all deals (admin view)
    getAllDeals: async (statusFilter?: string): Promise<ApiResponse<LandDeal[]>> => {
      let url = '/data/properties/list-all/';
      if (statusFilter) {
        url += `?status=${statusFilter}`;
      }
      const response = await api.get(url);
      const transformedData = response.data.map((property: any) => ({
        id: property.id.toString(),
        address: property.address,
        submittedOn: property.created_at,
        status: property.status,
        coach: 'Assigned Coach',
        agreedPrice: parseFloat(property.agreed_price || property.asking_price || 0),
        landType: property.land_type_detail?.display_name || property.land_type_name,
        acreage: parseFloat(property.acreage),
        totalFilesCount: property.total_files_count,
        buyer_rejected_notes: property.buyer_rejected_notes
      }));
      
      return {
        success: true,
        data: transformedData
      };
    },

    // Update deal status
    updateDealStatus: async (dealId: string, status: string, buyer_rejected_notes?: string): Promise<ApiResponse<{ id: string; status: string; buyer_rejected_notes?: string }>> => {
      const payload: { status: string; buyer_rejected_notes?: string } = { status };
      if (buyer_rejected_notes) {
        payload.buyer_rejected_notes = buyer_rejected_notes;
      }
      const response = await api.patch(`/data/properties/${dealId}/status/`, payload);
      return {
        success: true,
        data: response.data
      };
    },

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

    // Buyer profile update
    updateBuyer: async (buyerId: string, data: { name?: string; email?: string; phone?: string; }): Promise<ApiResponse<any>> => {
      const response = await api.put(`/buyers/${buyerId}/`, data);
      return { success: true, data: response.data };
    },

    // Buy Box endpoints
    getBuyerBuyBox: async (buyerId: string): Promise<ApiResponse<any>> => {
      const response = await api.get(`/buyers/${buyerId}/buy-box/`);
      return { success: true, data: response.data };
    },
    updateBuyerBuyBox: async (buyerId: string, data: any): Promise<ApiResponse<any>> => {
      const response = await api.put(`/buyers/${buyerId}/buy-box/`, data);
      return { success: true, data: response.data };
    },

    // Match buyers for a property
    matchBuyersForProperty: async (propertyId: string): Promise<ApiResponse<Array<{ id: number; score: number }>>> => {
      const response = await api.get(`/data/properties/${propertyId}/match-buyers/`);
      return { success: true, data: response.data };
    },

    // Get matching buyers for a property
    getPropertyMatchingBuyers: async (propertyId: string): Promise<ApiResponse<Array<any>>> => {
      const response = await api.get(`/data/properties/${propertyId}/matching-buyers/`);
      return { success: true, data: response.data };
    },

    // Get specific matching buyer details for a property
    getPropertyMatchingBuyerDetail: async (propertyId: string, buyerId: string): Promise<ApiResponse<any>> => {
      const response = await api.get(`/data/properties/${propertyId}/matching-buyers/${buyerId}/`);
      return { success: true, data: response.data };
    },

    // Toggle Buy Box active status
    toggleBuyBoxActive: async (buyerId: string): Promise<ApiResponse<any>> => {
      const response = await api.patch(`/buyers/${buyerId}/buybox/toggle/`);
      return { success: true, data: response.data };
    },

    // Delete buyer (soft delete)
    deleteBuyer: async (buyerId: string): Promise<ApiResponse<any>> => {
      const response = await api.delete(`/buyers/${buyerId}/delete/`);
      return { success: true, data: response.data };
    },

    // Get buyer matching stats
    getBuyerMatchingStats: async (buyerId: string): Promise<ApiResponse<any>> => {
      const response = await api.get(`/buyers/${buyerId}/matching-stats/`);
      return { success: true, data: response.data };
    },

    // Send deal to buyer
    sendDealToBuyer: async (data: { buyer: number; deal: number; status: string; match_score: number }): Promise<ApiResponse<any>> => {
      const response = await api.post('/buyers/send-to-buyer/', data);
      return { success: true, data: response.data };
    },

    // Get deals sent to a buyer
    getBuyerDealLogs: async (buyerId: string): Promise<ApiResponse<any[]>> => {
      const response = await api.get(`/buyers/${buyerId}/deal-logs/`);
      return { success: true, data: response.data };
    },
  },

  // Conversation functions
  conversations: {
    // Get all conversations for logged-in user (inbox)
    getInbox: async (): Promise<ApiResponse<any[]>> => {
      try {
        const response = await api.get('/data/conversations/inbox/');
        return {
          success: true,
          data: response.data
        };
      } catch (error) {
        throw new Error(handleApiError(error));
      }
    },

    // Get conversation details and messages for specific property submission
    getConversation: async (propertySubmissionId: string): Promise<ApiResponse<any>> => {
      try {
        const response = await api.get(`/data/conversations/${propertySubmissionId}/`);
        return {
          success: true,
          data: response.data
        };
      } catch (error) {
        throw new Error(handleApiError(error));
      }
    },

    // Send a message in conversation
    sendMessage: async (propertySubmissionId: string, messageBody: string): Promise<ApiResponse<any>> => {
      try {
        const response = await api.post(`/data/conversations/${propertySubmissionId}/send/`, {
          message: messageBody
        });
        return {
          success: true,
          data: response.data
        };
      } catch (error) {
        throw new Error(handleApiError(error));
      }
    },

    // Mark messages as read
    markAsRead: async (propertySubmissionId: string): Promise<ApiResponse<any>> => {
      try {
        const response = await api.put(`/data/conversations/${propertySubmissionId}/read/`);
        return {
          success: true,
          data: response.data
        };
      } catch (error) {
        throw new Error(handleApiError(error));
      }
    },

    // Get conversation messages for a property (legacy)
    getMessages: async (propertyId: string): Promise<ApiResponse<Array<{
      id: number;
      sender_username: string;
      property_submission_id: number;
      message: string;
      timestamp: string;
      is_admin: boolean;
    }>>> => {
      const response = await api.get(`/data/conversations/${propertyId}/`);
      return {
        success: true,
        data: response.data
      };
    },
  },
};

// Public API functions for non-authenticated users
export const getPublicBuyBoxCriteria = async (): Promise<Array<any>> => {
  const response = await api.get('/public/buybox-criteria/');
  return response.data;
};

export const getBuyerDeals = async (buyerId: string): Promise<Array<any>> => {
  const response = await api.get(`/buyers/${buyerId}/deal-logs/`);
  return response.data;
};

// Get full deal details for buyer portal - public endpoint
export const getBuyerDealDetails = async (dealLogId: string) => {
  try {
    const response = await api.get(`/buyer-deals/${dealLogId}/`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateBuyerDealStatus = async (
  dealLogId: string,
  action: 'accept' | 'reject',
  rejectNote?: string
): Promise<any> => {
  const payload: any = { action };
  if (action === 'reject' && rejectNote) {
    payload.reject_note = rejectNote;
  }
  const response = await api.patch(`/buyer-deals/${dealLogId}/response/`, payload);
  return response.data;
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