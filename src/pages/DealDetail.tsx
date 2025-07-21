import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  ArrowLeft, 
  MapPin, 
  DollarSign, 
  Calendar,
  FileText,
  Upload,
  Download,
  Send,
  User,
  Clock,
  Trash2
} from 'lucide-react';

const DealDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deal, setDeal] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load deal data
    const deals = JSON.parse(localStorage.getItem('userDeals') || '[]');
    const foundDeal = deals.find(d => d.id === id);
    
    if (foundDeal) {
      setDeal(foundDeal);
      
      // Load messages for this deal
      const savedMessages = localStorage.getItem(`messages_${id}`);
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      } else {
        // Demo messages
        const demoMessages = [
          {
            id: 1,
            sender: 'coach',
            senderName: foundDeal.coach,
            message: 'Thank you for submitting this deal. I\'ve reviewed the initial information and have some questions about the zoning and utilities.',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 2,
            sender: 'user',
            senderName: 'You',
            message: 'Hi! I can provide more details about the utilities. The property has power and water available at the street.',
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
          }
        ];
        setMessages(demoMessages);
        localStorage.setItem(`messages_${id}`, JSON.stringify(demoMessages));
      }
    }
    
    setIsLoading(false);
  }, [id]);

  const handleSendMessage = (e) => {
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
    localStorage.setItem(`messages_${id}`, JSON.stringify(updatedMessages));
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
      localStorage.setItem(`messages_${id}`, JSON.stringify(finalMessages));
    }, 3000);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusVariant = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'status-pending';
      case 'under review':
        return 'status-reviewed';
      case 'approved':
        return 'status-approved';
      case 'rejected':
        return 'status-rejected';
      default:
        return 'status-pending';
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading deal details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!deal) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Deal not found</h3>
          <p className="text-muted-foreground mb-6">The requested deal could not be found.</p>
          <Button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Deal {deal.id}</h1>
              <p className="text-muted-foreground">Submitted on {formatDate(deal.submittedOn)}</p>
            </div>
          </div>
          <Badge className={`${getStatusVariant(deal.status)} text-sm`}>
            {deal.status}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Deal Information */}
          <div className="space-y-6">
            {/* Basic Information */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Property Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Address</p>
                    <p className="text-foreground">{deal.lotAddress}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Land Type</p>
                    <p className="text-foreground capitalize">{deal.landType}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Lot Size</p>
                    <p className="text-foreground">{deal.lotSize}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Zoning</p>
                    <p className="text-foreground">{deal.zoningClassification || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Utilities</p>
                    <p className="text-foreground capitalize">{deal.utilitiesAvailable}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Access</p>
                    <p className="text-foreground capitalize">{deal.accessType?.replace('-', ' ')}</p>
                  </div>
                </div>
                
                {deal.nearestAttraction && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Nearest Attraction</p>
                    <p className="text-foreground">{deal.nearestAttraction}</p>
                  </div>
                )}
                
                {deal.landDescription && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Description</p>
                    <p className="text-foreground">{deal.landDescription}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Financial Details */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Financial Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Asking Price</span>
                    <span className="font-semibold text-lg">{formatCurrency(deal.askingPrice)}</span>
                  </div>
                  {deal.estimatedAEV && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Estimated AEV/ADV</span>
                      <span className="font-medium">{formatCurrency(parseFloat(deal.estimatedAEV))}</span>
                    </div>
                  )}
                  {deal.developmentCosts && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Development Costs</span>
                      <span className="font-medium">{formatCurrency(parseFloat(deal.developmentCosts))}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Documents */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                {deal.files && deal.files.length > 0 ? (
                  <div className="space-y-2">
                    {deal.files.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No documents uploaded</p>
                )}
                
                <div className="mt-4 pt-4 border-t border-border">
                  <Button variant="outline" className="w-full">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Additional Files
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Conversation */}
          <div className="space-y-6">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Conversation with Coach
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Messages */}
                  <div className="h-96 overflow-y-auto space-y-4 p-4 bg-secondary/20 rounded-lg">
                    {messages.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        <p>No messages yet. Start a conversation with your coach!</p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
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
                  Deal Status
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
                  <span className="font-medium">{deal.coach}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Submitted</span>
                  <span className="font-medium">{formatDate(deal.submittedOn)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DealDetail;