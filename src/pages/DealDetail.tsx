import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import DashboardLayout from '@/components/DashboardLayout';
import PropertyInformation from '@/components/deal-detail/PropertyInformation';
import DocumentsSection from '@/components/deal-detail/DocumentsSection';
import ConversationSection from '@/components/deal-detail/ConversationSection';
import { ArrowLeft, FileText, MapPin, Upload, MessageCircle } from 'lucide-react';
import { landDealsApi, handleApiError } from '@/services/landDealsApi';
import { toast } from '@/hooks/use-toast';

const DealDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deal, setDeal] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    loadDealData();
  }, [id]);

  const loadDealData = async () => {
    try {
      const response = await landDealsApi.getLandDealById(id);
      if (response.success) {
        setDeal(response.data);
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
      count: null
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'details':
        return <PropertyInformation deal={deal} formatCurrency={formatCurrency} />;
      case 'documents':
        return <DocumentsSection deal={deal} />;
      case 'conversation':
        return (
          <ConversationSection 
            deal={deal}
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
              onClick={() => navigate('/dashboard')}
              className="hover:bg-primary/5"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Deal {deal.id}</h1>
              <p className="text-muted-foreground">Submitted on {formatDate(deal.submittedOn)}</p>
            </div>
          </div>
          <Badge className={`${getStatusVariant(deal.status)} text-sm`}>
            {deal.status}
          </Badge>
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

export default DealDetail;