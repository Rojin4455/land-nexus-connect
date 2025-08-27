import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { logoutUser } from '@/store/authSlice';
import { landDealsApi, handleApiError } from '@/services/landDealsApi';
import { 
  MessageSquare, 
  User, 
  UserCheck, 
  Send, 
  LogOut, 
  Shield, 
  ArrowLeft,
  ExternalLink,
  TrendingUp,
  MapPin,
  Clock,
  DollarSign
} from 'lucide-react';

interface ConversationItem {
  property_submission_id: number;
  property_title: string;
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

interface Message {
  id: number;
  sender_username: string;
  property_submission_id: number;
  message: string;
  timestamp: string;
  is_admin: boolean;
}

const AdminConversationCenter = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  
  // State management
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [dealDetails, setDealDetails] = useState<any>(null);

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated || !user?.is_staff) {
      navigate('/admin/login');
      return;
    }
    
    loadConversations();
  }, [isAuthenticated, user, navigate]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await landDealsApi.conversations.getInbox();
      if (response.success) {
        setConversations(response.data);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: handleApiError(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectConversation = async (conversation: ConversationItem) => {
    setSelectedConversation(conversation);
    setMessagesLoading(true);
    
    try {
      // Load messages
      const messagesResponse = await landDealsApi.conversations.getMessages(conversation.property_submission_id.toString());
      if (messagesResponse.success) {
        setMessages(messagesResponse.data);
      }

      // Load deal details
      const dealResponse = await landDealsApi.getLandDealById(conversation.property_submission_id.toString());
      if (dealResponse.success) {
        setDealDetails(dealResponse.data);
      }

      // Mark as read if there are unread messages
      if (conversation.unread_count > 0) {
        await landDealsApi.conversations.markAsRead(conversation.property_submission_id.toString());
        // Update local state
        setConversations(prev => prev.map(conv => 
          conv.property_submission_id === conversation.property_submission_id 
            ? { ...conv, unread_count: 0 } 
            : conv
        ));
      }
    } catch (error) {
      toast({
        title: "Error",
        description: handleApiError(error),
        variant: "destructive",
      });
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || isSending) return;

    try {
      setIsSending(true);
      const response = await landDealsApi.conversations.sendMessage(
        selectedConversation.property_submission_id.toString(), 
        newMessage
      );
      
      if (response.success) {
        setMessages(prev => [...prev, response.data]);
        setNewMessage('');
        
        // Update conversation list with new last message
        setConversations(prev => prev.map(conv => 
          conv.property_submission_id === selectedConversation.property_submission_id
            ? {
                ...conv,
                last_message: {
                  id: response.data.id,
                  sender: { id: user?.id || 0, name: 'Admin' },
                  content: newMessage,
                  timestamp: new Date().toISOString()
                }
              }
            : conv
        ));
        
        toast({
          title: "Message sent",
          description: "Your message has been sent successfully.",
        });
      }
    } catch (error) {
      toast({
        title: "Error sending message",
        description: handleApiError(error),
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
    } catch (error) {
      // Handle logout anyway
    } finally {
      navigate('/admin/login');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary rounded-lg">
                <MessageSquare className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Conversation Center</h1>
                <p className="text-sm text-muted-foreground">Manage all deal conversations</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin/dashboard')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">Admin</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-180px)]">
          {/* Conversations List - Left Sidebar */}
          <Card className="card-elevated lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Active Conversations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-280px)]">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="text-center py-8 px-4">
                    <MessageSquare className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-muted-foreground">No conversations yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {conversations.map((conversation) => (
                      <div
                        key={conversation.property_submission_id}
                        className={`p-4 cursor-pointer hover:bg-accent/50 transition-colors ${
                          selectedConversation?.property_submission_id === conversation.property_submission_id
                            ? 'bg-accent'
                            : ''
                        }`}
                        onClick={() => selectConversation(conversation)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm truncate text-foreground">
                              {conversation.property_title}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              JV Partner: {conversation.last_message.sender.name}
                            </p>
                          </div>
                          {conversation.unread_count > 0 && (
                            <Badge variant="destructive" className="ml-2 text-xs">
                              {conversation.unread_count}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {conversation.last_message.content}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDate(conversation.last_message.timestamp)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Conversation Messages - Center */}
          <Card className="card-elevated lg:col-span-1">
            <CardHeader>
              <CardTitle>
                {selectedConversation ? (
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{selectedConversation.property_title}</div>
                      <div className="text-sm text-muted-foreground font-normal">
                        {selectedConversation.last_message.sender.name}
                      </div>
                    </div>
                  </div>
                ) : (
                  'Select a conversation'
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {selectedConversation ? (
                <div className="flex flex-col h-[calc(100vh-340px)]">
                  <ScrollArea className="flex-1 p-4">
                    {messagesLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageSquare className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                        <p className="text-muted-foreground">No messages yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex gap-3 ${
                              message.is_admin ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div
                              className={`flex gap-3 max-w-[80%] ${
                                message.is_admin ? 'flex-row-reverse' : 'flex-row'
                              }`}
                            >
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className={message.is_admin ? 'bg-primary text-primary-foreground' : 'bg-secondary'}>
                                  {message.is_admin ? <UserCheck className="w-4 h-4" /> : <User className="w-4 h-4" />}
                                </AvatarFallback>
                              </Avatar>
                              <div
                                className={`p-3 rounded-lg ${
                                  message.is_admin
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-secondary'
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-medium opacity-90">
                                    {message.is_admin ? 'Admin' : message.sender_username}
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
                    )}
                  </ScrollArea>
                  
                  <Separator />
                  
                  <div className="p-4">
                    <form onSubmit={handleSendMessage} className="space-y-3">
                      <Textarea
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="min-h-[80px] resize-none"
                        disabled={isSending}
                      />
                      <div className="flex justify-end">
                        <Button type="submit" disabled={!newMessage.trim() || isSending}>
                          {isSending ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              Send Message
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[calc(100vh-340px)]">
                  <div className="text-center">
                    <MessageSquare className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground">Select a conversation to start messaging</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Deal Information - Right Sidebar */}
          <Card className="card-elevated lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Deal Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedConversation && dealDetails ? (
                <div className="space-y-6">
                  {/* Property Details */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-foreground mb-2">Property Details</h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{dealDetails.address}</p>
                            <p className="text-xs text-muted-foreground">{dealDetails.landType}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{formatCurrency(dealDetails.agreedPrice)}</p>
                            <p className="text-xs text-muted-foreground">Agreed Price</p>
                          </div>
                        </div>
                        {dealDetails.acreage && (
                          <div>
                            <p className="text-sm font-medium">{dealDetails.acreage} acres</p>
                            <p className="text-xs text-muted-foreground">Property Size</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* Deal Status */}
                    <div>
                      <h3 className="font-medium text-foreground mb-2">Deal Status</h3>
                      <Badge variant="outline" className="mb-2">
                        {dealDetails.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        Submitted on {formatDate(dealDetails.submittedOn)}
                      </p>
                    </div>

                    <Separator />

                    {/* Quick Actions */}
                    <div className="space-y-3">
                      <h3 className="font-medium text-foreground">Quick Actions</h3>
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => navigate(`/admin/deal/${dealDetails.id}`)}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Full Deal Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => {
                            // Navigate to matching buyers section of deal detail
                            navigate(`/admin/deal/${dealDetails.id}?tab=buyers`);
                          }}
                        >
                          <TrendingUp className="h-4 w-4 mr-2" />
                          View Match Score
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : selectedConversation ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">Select a conversation to view deal information</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminConversationCenter;