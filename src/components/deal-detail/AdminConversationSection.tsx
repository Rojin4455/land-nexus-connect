import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, User, UserCheck } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AdminConversationSectionProps {
  deal: any;
  messages: any[];
  setMessages: (messages: any[]) => void;
  formatDate: (dateString: string) => string;
  getStatusVariant: (status: string) => string;
}

const AdminConversationSection = ({ 
  deal, 
  messages, 
  setMessages, 
  formatDate, 
  getStatusVariant 
}: AdminConversationSectionProps) => {
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;

    const message = {
      id: Date.now(),
      sender: 'admin',
      senderName: 'Admin',
      message: newMessage,
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...messages, message];
    setMessages(updatedMessages);
    localStorage.setItem(`messages_${deal.id}`, JSON.stringify(updatedMessages));
    
    setNewMessage('');
    
    toast({
      title: "Message sent",
      description: "Your message has been sent to the user.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Conversation */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Conversation with {deal.user_detail?.username || 'User'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {messages.length > 0 ? (
            <div className="space-y-4 mb-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.sender === 'admin' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`flex gap-3 max-w-[80%] ${
                      message.sender === 'admin' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {message.sender === 'admin' ? (
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <UserCheck className="w-4 h-4 text-primary" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-secondary/50 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div
                      className={`p-3 rounded-lg ${
                        message.sender === 'admin'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium opacity-90">
                          {message.senderName}
                        </span>
                        <span className="text-xs opacity-60">
                          {formatDate(message.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm">{message.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 mb-6">
              <MessageCircle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">No conversation yet</p>
              <p className="text-sm text-muted-foreground">Start a conversation with the user about this deal</p>
            </div>
          )}

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="space-y-3">
            <Textarea
              placeholder="Type your message to the user..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="min-h-[80px] resize-none"
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={!newMessage.trim()}>
                <Send className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Deal Status and User Info */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle>Deal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <Badge className={`${getStatusVariant(deal.status)} mt-1`}>
                {deal.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">User</p>
              <div className="mt-1">
                <p className="font-medium">{deal.user_detail?.username || 'Unknown User'}</p>
                <p className="text-sm text-muted-foreground">{deal.user_detail?.email}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Submitted On</p>
              <p className="mt-1">{formatDate(deal.created_at)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
              <p className="mt-1">{formatDate(deal.updated_at)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminConversationSection;