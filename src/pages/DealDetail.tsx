import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import DashboardLayout from '@/components/DashboardLayout';
import PropertyInformation from '@/components/deal-detail/PropertyInformation';
import DocumentsSection from '@/components/deal-detail/DocumentsSection';
import ConversationSection from '@/components/deal-detail/ConversationSection';
import { ArrowLeft, FileText } from 'lucide-react';

const DealDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deal, setDeal] = useState(null);
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
      <div className="max-w-7xl mx-auto space-y-6">
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

        {/* Three Column Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Property Information Section */}
          <div className="xl:col-span-1 animate-fade-in">
            <PropertyInformation 
              deal={deal} 
              formatCurrency={formatCurrency} 
            />
          </div>

          {/* Documents Section */}
          <div className="xl:col-span-1 animate-fade-in">
            <DocumentsSection deal={deal} />
          </div>

          {/* Conversation Section */}
          <div className="xl:col-span-1 animate-fade-in">
            <ConversationSection 
              deal={deal}
              messages={messages}
              setMessages={setMessages}
              formatDate={formatDate}
              getStatusVariant={getStatusVariant}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DealDetail;