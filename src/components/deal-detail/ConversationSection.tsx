import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { User, Send, MessageCircle, Clock } from 'lucide-react';
import { landDealsApi, handleApiError } from '@/services/landDealsApi';

interface ConversationSectionProps {
  deal: any;
  formatDate: (dateString: string) => string;
  getStatusVariant: (status: string) => string;
}

const ConversationSection = ({ 
  deal, 
  formatDate, 
  getStatusVariant 
}: ConversationSectionProps) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    loadMessages();
  }, [deal.id]);

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const response = await landDealsApi.conversations.getMessages(deal.id);
      if (response.success) {
        setMessages(response.data);
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast({
        title: "Error loading messages",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    try {
      setIsSending(true);
      const response = await landDealsApi.conversations.sendMessage(deal.id, newMessage);
      if (response.success) {
        setMessages(prev => [...prev, response.data]);
        setNewMessage('');
        toast({
          title: "Message sent",
          description: "Your message has been sent successfully.",
        });
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast({
        title: "Error sending message",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Conversation */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Conversation with Coach
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Messages */}
            <div className="h-96 overflow-y-auto space-y-4 p-4 bg-secondary/20 rounded-lg">
              {isLoading ? (
                <div className="text-center text-muted-foreground py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-sm">Loading messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium mb-1">No messages yet</p>
                  <p className="text-sm">Start a conversation with the admin!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${!message.is_admin ? 'justify-end' : 'justify-start'} animate-fade-in`}
                  >
                    <div className={`max-w-xs lg:max-w-md ${
                      !message.is_admin 
                        ? 'chat-message chat-message-user' 
                        : 'chat-message chat-message-admin'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium">
                          {message.is_admin ? 'Admin' : message.sender_username}
                        </span>
                        <span className="text-xs opacity-70">
                          {formatDate(message.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm">{message.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Textarea
                placeholder="Type your message to the admin..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 min-h-[60px] resize-none"
                disabled={isSending}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
              />
              <Button type="submit" disabled={!newMessage.trim() || isSending}>
                {isSending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* Deal Status & Info */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Deal Status & Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Status</span>
            <Badge className={getStatusVariant(deal.status)}>
              {deal.status}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Property Address</span>
            <span className="font-medium text-right">{deal.address}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Submitted</span>
            <span className="font-medium">{formatDate(deal.submittedOn)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConversationSection;