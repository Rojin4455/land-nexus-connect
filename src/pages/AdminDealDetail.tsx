import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DashboardLayout from '@/components/DashboardLayout';
import PropertyInformation from '@/components/deal-detail/PropertyInformation';
import AdminDocumentsSection from '@/components/deal-detail/AdminDocumentsSection';
import AdminConversationSection from '@/components/deal-detail/AdminConversationSection';
import { ArrowLeft, FileText, MapPin, Upload, MessageCircle, Edit } from 'lucide-react';
import { landDealsApi, handleApiError } from '@/services/landDealsApi';
import { toast } from '@/hooks/use-toast';

const AdminDealDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deal, setDeal] = useState<any>(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    loadDealData();
  }, [id]);

  const loadDealData = async () => {
    try {
      const response = await landDealsApi.getLandDealById(id);
      if (response.success) {
        setDeal(response.data);
        
        // Load messages for this deal (still using localStorage for now)
        const savedMessages = localStorage.getItem(`messages_${id}`);
        if (savedMessages) {
          setMessages(JSON.parse(savedMessages));
        } else {
          // Demo messages
          const demoMessages = [
            {
              id: 1,
              sender: 'coach',
              senderName: 'Coach',
              message: 'Thank you for submitting this deal. I\'ve reviewed the initial information and have some questions about the zoning and utilities.',
              timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
              id: 2,
              sender: 'user',
              senderName: (response.data as any).user_detail?.username || 'User',
              message: 'Hi! I can provide more details about the utilities. The property has power and water available at the street.',
              timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
            }
          ];
          setMessages(demoMessages);
          localStorage.setItem(`messages_${id}`, JSON.stringify(demoMessages));
        }
      } else {
        toast({
          title: "Deal not found",
          description: "The requested deal could not be found.",
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast({
        title: "Error loading deal",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      const response = await landDealsApi.admin.updateDealStatus(id!, newStatus);
      if (response.success) {
        setDeal(prev => ({ ...prev, status: newStatus }));
        toast({
          title: "Status updated",
          description: `Deal status has been updated to ${newStatus}.`,
        });
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast({
        title: "Error updating status",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
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
          <Button onClick={() => navigate('/admin/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const tabs = [
    {
      id: 'details',
      label: 'Main Details',
      icon: MapPin,
      count: null
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: Upload,
      count: deal?.files?.length || 0
    },
    {
      id: 'conversation',
      label: 'Conversation',
      icon: MessageCircle,
      count: messages.length
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'details':
        return <PropertyInformation deal={deal} formatCurrency={formatCurrency} />;
      case 'documents':
        return <AdminDocumentsSection deal={deal} />;
      case 'conversation':
        return (
          <AdminConversationSection 
            deal={deal}
            messages={messages}
            setMessages={setMessages}
            formatDate={formatDate}
            getStatusVariant={getStatusVariant}
          />
        );
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline"
              onClick={() => navigate('/admin/dashboard')}
              className="hover:bg-primary/5"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Deal {deal.id}</h1>
              <p className="text-muted-foreground">
                Submitted by {deal.user_detail?.username || 'Unknown User'} on {formatDate(deal.created_at)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge className={`${getStatusVariant(deal.status)} text-sm`}>
              {deal.status}
            </Badge>
            
            {/* Status Update Dropdown */}
            <div className="flex items-center gap-2">
              <Edit className="h-4 w-4 text-muted-foreground" />
              <Select value={deal.status} onValueChange={handleStatusUpdate} disabled={isUpdatingStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="under review">Under Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-card rounded-lg border border-border p-1 animate-fade-in">
          <div className="flex space-x-1">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 flex-1 ${
                  activeTab === tab.id 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'hover:bg-secondary/50'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span className="font-medium">{tab.label}</span>
                {tab.count !== null && tab.count > 0 && (
                  <Badge 
                    variant="secondary" 
                    className={`ml-1 text-xs ${
                      activeTab === tab.id 
                        ? 'bg-primary-foreground/20 text-primary-foreground' 
                        : 'bg-primary/10 text-primary'
                    }`}
                  >
                    {tab.count}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="animate-fade-in">
          {renderTabContent()}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDealDetail;