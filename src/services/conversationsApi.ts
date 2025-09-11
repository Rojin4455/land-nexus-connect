import axios from 'axios';

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
  const token = localStorage.getItem('access_token');
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