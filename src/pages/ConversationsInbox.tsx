import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { landDealsApi } from '@/services/landDealsApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAppSelector } from '@/hooks/useAppSelector';
import DashboardLayout from '@/components/DashboardLayout';

interface ConversationPreview {
  id: string;
  property_submission: {
    id: string;
    title: string;
    address: string;
  };
  latest_message: {
    id: string;
    sender_name: string;
    message: string;
    timestamp: string;
    is_read: boolean;
  };
  unread_count: number;
  participants: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;
}

const ConversationsInbox: React.FC = () => {
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadConversations();
  }, [isAuthenticated, navigate]);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const data = await landDealsApi.conversations.getInbox();
      setConversations(data.conversations || []);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load conversations",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) { // 7 days
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleConversationClick = (propertySubmissionId: string) => {
    navigate(`/conversations/${propertySubmissionId}`);
  };

  const renderConversationItem = (conversation: ConversationPreview) => (
    <Card
      key={conversation.id}
      className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-transparent hover:border-l-primary"
      onClick={() => handleConversationClick(conversation.property_submission.id)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-sm truncate">
                {conversation.property_submission.title}
              </h3>
              {conversation.unread_count > 0 && (
                <Badge variant="destructive" className="text-xs px-2 py-0">
                  {conversation.unread_count}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-2 truncate">
              {conversation.property_submission.address}
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <span className="font-medium">
                {conversation.latest_message.sender_name}:
              </span>
            </div>
            <p className="text-sm text-foreground line-clamp-2 mb-2">
              {conversation.latest_message.message}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 ml-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatTimestamp(conversation.latest_message.timestamp)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <DashboardLayout activeTab="Conversations">
        <div className="container mx-auto px-4 py-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Conversations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeTab="Conversations">
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Conversations
              </div>
              <Badge variant="outline">
                {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {conversations.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>
                <p className="text-muted-foreground mb-4">
                  Conversations will appear here when you submit property deals or receive messages from admins.
                </p>
                <Button onClick={() => navigate('/submit-deal')}>
                  Submit Your First Deal
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {conversations.map(renderConversationItem)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ConversationsInbox;