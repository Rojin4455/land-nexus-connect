import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { landDealsApi } from '@/services/landDealsApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Send, MessageCircle, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAppSelector } from '@/hooks/useAppSelector';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  sender_name: string;
  sender_email: string;
  sender_role: string;
  message: string;
  timestamp: string;
  is_read: boolean;
}

interface ConversationData {
  id: string;
  property_submission: {
    id: string;
    title: string;
    address: string;
    status: string;
    submitted_at: string;
  };
  messages: Message[];
  participants: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;
}

const ConversationDetail: React.FC = () => {
  const { propertySubmissionId } = useParams<{ propertySubmissionId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  
  const [conversation, setConversation] = useState<ConversationData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!propertySubmissionId) {
      navigate('/conversations');
      return;
    }
    loadConversation();
  }, [propertySubmissionId, isAuthenticated, navigate]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversation = async () => {
    if (!propertySubmissionId) return;
    
    try {
      setIsLoading(true);
      const data = await landDealsApi.conversations.getConversation(propertySubmissionId);
      setConversation(data);
      setMessages(data.messages || []);
      
      // Mark messages as read
      await landDealsApi.conversations.markAsRead(propertySubmissionId);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load conversation",
        variant: "destructive",
      });
      navigate('/conversations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !propertySubmissionId || isSending) return;
    
    try {
      setIsSending(true);
      
      // Optimistically add message to UI
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        sender_name: user?.first_name + ' ' + user?.last_name || 'You',
        sender_email: user?.email || '',
        sender_role: (user as any)?.is_admin ? 'admin' : 'user',
        message: newMessage.trim(),
        timestamp: new Date().toISOString(),
        is_read: true
      };
      
      setMessages(prev => [...prev, optimisticMessage]);
      setNewMessage('');
      
      // Send to server
      const response = await landDealsApi.conversations.sendMessage(propertySubmissionId, newMessage.trim());
      
      // Replace optimistic message with server response
      setMessages(prev => [
        ...prev.filter(msg => msg.id !== optimisticMessage.id),
        response.message
      ]);
      
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
      });
    } catch (error) {
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')));
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      case 'under review': return 'secondary';
      default: return 'outline';
    }
  };

  const isCurrentUser = (senderEmail: string) => {
    return senderEmail === user?.email;
  };

  const renderMessage = (message: Message, index: number) => {
    const isOwn = isCurrentUser(message.sender_email);
    const showSender = index === 0 || messages[index - 1].sender_email !== message.sender_email;
    
    return (
      <div key={message.id} className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
        <div className={cn("max-w-[70%] space-y-1", isOwn ? "items-end" : "items-start")}>
          {showSender && (
            <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", 
              isOwn ? "justify-end" : "justify-start")}>
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{message.sender_name}</span>
                <Badge variant="outline" className="text-xs">
                  {message.sender_role}
                </Badge>
              </div>
            </div>
          )}
          <div className={cn(
            "rounded-lg px-3 py-2 text-sm break-words",
            isOwn 
              ? "bg-primary text-primary-foreground ml-4" 
              : "bg-muted mr-4"
          )}>
            {message.message}
          </div>
          <div className={cn("text-xs text-muted-foreground", isOwn ? "text-right" : "text-left")}>
            {formatTimestamp(message.timestamp)}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-6 rounded" />
              <Skeleton className="h-6 w-48" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-16 w-3/4" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="text-center py-12">
            <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Conversation not found</h3>
            <Button onClick={() => navigate('/conversations')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Conversations
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        {/* Header */}
        <Card className="mb-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/conversations')}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <CardTitle className="text-lg">
                    {conversation.property_submission.title}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {conversation.property_submission.address}
                  </p>
                </div>
              </div>
              <Badge variant={getStatusVariant(conversation.property_submission.status)}>
                {conversation.property_submission.status}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Messages */}
        <Card className="flex-1 flex flex-col">
          <CardContent className="flex-1 flex flex-col p-0">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Start the conversation by sending a message</p>
                </div>
              ) : (
                messages.map((message, index) => renderMessage(message, index))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 min-h-[60px] resize-none"
                  disabled={isSending}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || isSending}
                  className="self-end"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ConversationDetail;