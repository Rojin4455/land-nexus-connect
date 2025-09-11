import axios from 'axios';

const API_BASE_URL = 'https://your-domain.com/api';

interface ConversationInboxItem {
  property_submission_id: number;
  property_title: string;
  partner_name: string;
  last_message: {
    id: number;
    sender: {
      id: number;
      name: string;
    };
    content: string;
    timestamp: string;
  };
  unread_count: number;
}

export const conversationsApi = {
  async getInbox(token: string): Promise<ConversationInboxItem[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/conversations/inbox/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching conversation inbox:', error);
      throw error;
    }
  }
};