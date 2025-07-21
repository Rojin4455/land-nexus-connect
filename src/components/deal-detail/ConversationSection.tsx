import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { User, Send, MessageCircle, Clock } from 'lucide-react';

interface ConversationSectionProps {
  deal: any;
  messages: any[];
  setMessages: (messages: any[]) => void;
  formatDate: (dateString: string) => string;
  getStatusVariant: (status: string) => string;
}

const ConversationSection = ({ 
  deal, 
  messages, 
  setMessages, 
  formatDate, 
  getStatusVariant 
}: ConversationSectionProps) => {
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message = {
      id: Date.now(),
      sender: 'user',
      senderName: 'You',
      message: newMessage,
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...messages, message];
    setMessages(updatedMessages);
    localStorage.setItem(`messages_${deal.id}`, JSON.stringify(updatedMessages));
    setNewMessage('');

    toast({
      title: "Message sent",
      description: "Your message has been sent to your coach.",
    });

    // Simulate coach response after 3 seconds
    setTimeout(() => {
      const coachResponse = {
        id: Date.now() + 1,
        sender: 'coach',
        senderName: deal.coach,
        message: 'Thanks for the additional information! I\'ll review this and get back to you with my analysis.',
        timestamp: new Date().toISOString()
      };
      
      const finalMessages = [...updatedMessages, coachResponse];
      setMessages(finalMessages);
      localStorage.setItem(`messages_${deal.id}`, JSON.stringify(finalMessages));
    }, 3000);
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
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium mb-1">No messages yet</p>
                  <p className="text-sm">Start a conversation with your coach!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                  >
                    <div className={`max-w-xs lg:max-w-md ${
                      message.sender === 'user' 
                        ? 'chat-message chat-message-user' 
                        : 'chat-message chat-message-admin'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium">{message.senderName}</span>
                        <span className="text-xs opacity-70">
                          {new Date(message.timestamp).toLocaleTimeString()}
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
                placeholder="Type your message to the coach..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 min-h-[60px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
              />
              <Button type="submit" disabled={!newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* Deal Status & Coach Info */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Deal Status & Coach
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
            <span className="text-muted-foreground">Assigned Coach</span>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{deal.coach}</span>
            </div>
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