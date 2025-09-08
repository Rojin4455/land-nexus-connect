import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getBuyerDeals, updateBuyerDealStatus, getBuyerDealDetails } from '@/services/landDealsApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Eye, CheckCircle, XCircle, MapPin } from 'lucide-react';
import PropertyInformation from '@/components/deal-detail/PropertyInformation';

interface DealLog {
  id: number;
  buyer: number;
  buyer_name: string;
  deal: number;
  deal_address: string;
  status: string;
  sent_date: string;
  match_score: string;
}

const BuyerPortal = () => {
  const { buyerId } = useParams<{ buyerId: string }>();
  const [deals, setDeals] = useState<DealLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeal, setSelectedDeal] = useState<DealLog | null>(null);
  const [selectedDealDetails, setSelectedDealDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (buyerId) {
      loadDeals();
    }
  }, [buyerId]);

  const loadDeals = async () => {
    try {
      setLoading(true);
      const data = await getBuyerDeals(buyerId!);
      setDeals(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load deals",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (dealLogId: number, action: 'accept' | 'reject') => {
    try {
      setUpdating(true);
      const response = await updateBuyerDealStatus(dealLogId.toString(), action);
      
      // Update local state with the response data
      setDeals(deals.map(deal => 
        deal.id === dealLogId ? { ...deal, status: response.status } : deal
      ));
      
      toast({
        title: "Success",
        description: `Deal ${action === 'accept' ? 'accepted' : 'rejected'} successfully`,
      });
      
      setSelectedDeal(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update deal status",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-blue-500';
      case 'accepted': return 'bg-green-500';
      case 'declined': return 'bg-red-500';
      case 'offer_made': return 'bg-yellow-500';
      case 'under_contract': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const loadDealDetails = async (dealLogId: number) => {
    try {
      setLoadingDetails(true);
      const dealDetails = await getBuyerDealDetails(dealLogId.toString());
      setSelectedDealDetails(dealDetails);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load deal details",
        variant: "destructive",
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleViewDetails = async (deal: DealLog) => {
    setSelectedDeal(deal);
    setSelectedDealDetails(null);
    await loadDealDetails(deal.id); // Use deal log ID instead of deal ID
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your deals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Your Land Deals</h1>
            <p className="text-muted-foreground">Review deals sent to you and make your decision</p>
          </div>

          {deals.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <p className="text-muted-foreground">No deals have been sent to you yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {deals.map((deal) => (
                <Card key={deal.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-primary" />
                          {deal.deal_address}
                        </CardTitle>
                        <CardDescription>
                          Sent on {formatDate(deal.sent_date)} • Match Score: {deal.match_score}%
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(deal.status)}>
                        {deal.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <div className="text-sm text-muted-foreground mb-2">Deal ID: {deal.deal}</div>
                      <div className="text-sm text-muted-foreground">Buyer: {deal.buyer_name}</div>
                    </div>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => handleViewDetails(deal)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details & Respond
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-primary" />
                            {selectedDeal?.deal_address}
                          </DialogTitle>
                          <DialogDescription>
                            Deal ID: {selectedDeal?.deal} • Match Score: {selectedDeal?.match_score}% • Sent on {selectedDeal && formatDate(selectedDeal.sent_date)}
                          </DialogDescription>
                        </DialogHeader>
                        
                        {selectedDeal && (
                          <div className="space-y-6">
                            {/* Match Score and Status */}
                            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                              <div>
                                <h4 className="font-semibold mb-2">Match Score</h4>
                                <p className="text-2xl font-bold text-primary">{selectedDeal.match_score}%</p>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-2">Current Status</h4>
                                <Badge className={getStatusColor(selectedDeal.status)}>
                                  {selectedDeal.status.replace('_', ' ').toUpperCase()}
                                </Badge>
                              </div>
                            </div>

                            {/* Full Deal Details */}
                            {loadingDetails ? (
                              <div className="flex items-center justify-center py-12">
                                <div className="text-center">
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                                  <p className="text-muted-foreground">Loading deal details...</p>
                                </div>
                              </div>
                            ) : selectedDealDetails ? (
                              <PropertyInformation 
                                deal={selectedDealDetails.deal} 
                                formatCurrency={formatCurrency} 
                              />
                            ) : (
                              <div className="text-center py-8">
                                <p className="text-muted-foreground">Deal details could not be loaded</p>
                              </div>
                            )}
                            
                            {/* Action Buttons */}
                            {selectedDeal.status === 'sent' && (
                              <div className="flex gap-3 pt-6 border-t bg-card p-4 rounded-lg">
                                <Button
                                  onClick={() => handleStatusUpdate(selectedDeal.id, 'accept')}
                                  disabled={updating}
                                  className="flex-1"
                                  size="lg"
                                >
                                  <CheckCircle className="h-5 w-5 mr-2" />
                                  Accept This Deal
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => handleStatusUpdate(selectedDeal.id, 'reject')}
                                  disabled={updating}
                                  className="flex-1"
                                  size="lg"
                                >
                                  <XCircle className="h-5 w-5 mr-2" />
                                  Decline Deal
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BuyerPortal;