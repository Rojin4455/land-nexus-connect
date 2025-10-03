import axios from 'axios';
import { store } from '@/store';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Create axios instance with auth interceptor
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth interceptor
apiClient.interceptors.request.use((config) => {
  // Get token from Redux store first (most up-to-date)
  let token = store.getState().auth?.accessToken;
  
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
    token = localStorage.getItem('access_token') || localStorage.getItem('adminToken') || localStorage.getItem('userToken');
  }
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface ConversationInboxItem {
  property_submission_id: number;
  address: string;
  last_message: string | null;
  last_message_timestamp: string | null;
  unread_count: number;
}

export const conversationsApi = {
  getInbox: async (): Promise<{ success: boolean; data: ConversationInboxItem[] }> => {
    try {
      const response = await apiClient.get('/conversations/inbox/');
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Error fetching conversations inbox:', error);
      return {
        success: false,
        data: [],
      };
    }
  },
};