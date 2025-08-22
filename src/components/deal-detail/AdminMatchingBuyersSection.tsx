import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Eye, Phone, Mail, DollarSign, MapPin, Target, Percent, AlertCircle, Loader2 } from 'lucide-react';
import { landDealsApi, handleApiError } from '@/services/landDealsApi';
import { toast } from '@/hooks/use-toast';

interface MatchingBuyer {
  id: number;
  name: string;
  email: string;
  phone: string;
  match_score: number;
  buy_box_details?: {
    min_price: number;
    max_price: number;
    preferred_land_types: string[];
    location_preferences: string[];
    investment_strategy: string[];
  };
}

interface AdminMatchingBuyersSectionProps {
  propertyId: string;
}

const AdminMatchingBuyersSection = ({ propertyId }: AdminMatchingBuyersSectionProps) => {
  const [matchingBuyers, setMatchingBuyers] = useState<MatchingBuyer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBuyer, setSelectedBuyer] = useState<MatchingBuyer | null>(null);
  const [buyerDetails, setBuyerDetails] = useState<any>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  useEffect(() => {
    loadMatchingBuyers();
  }, [propertyId]);

  const loadMatchingBuyers = async () => {
    try {
      const response = await landDealsApi.admin.getPropertyMatchingBuyers(propertyId);
      if (response.success) {
        setMatchingBuyers(response.data);
      } else {
        toast({
          title: "Error loading matching buyers",
          description: "Could not load matching buyers for this property.",
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast({
        title: "Error loading matching buyers",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadBuyerDetails = async (buyerId: string) => {
    setIsLoadingDetails(true);
    try {
      const response = await landDealsApi.admin.getPropertyMatchingBuyerDetail(propertyId, buyerId);
      if (response.success) {
        setBuyerDetails(response.data);
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast({
        title: "Error loading buyer details",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getMatchScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Good Match';
    return 'Fair Match';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleViewDetails = (buyer: MatchingBuyer) => {
    setSelectedBuyer(buyer);
    loadBuyerDetails(buyer.id.toString());
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading matching buyers...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Matching Buyers ({matchingBuyers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {matchingBuyers.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Matching Buyers</h3>
              <p className="text-muted-foreground">
                No buyers match the criteria for this property.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {matchingBuyers.map((buyer) => (
                <Card key={buyer.id} className="border border-border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {buyer.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground">{buyer.name}</h4>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {buyer.email}
                            </div>
                            {buyer.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {buyer.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${getMatchScoreColor(buyer.match_score)}`}>
                            <Percent className="h-3 w-3 mr-1" />
                            {buyer.match_score}%
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {getMatchScoreLabel(buyer.match_score)}
                          </p>
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(buyer)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-primary" />
                                {selectedBuyer?.name} - Buyer Details
                              </DialogTitle>
                            </DialogHeader>
                            
                            <ScrollArea className="h-[60vh] pr-4">
                              {isLoadingDetails ? (
                                <div className="flex items-center justify-center h-32">
                                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                              ) : buyerDetails ? (
                                <div className="space-y-6">
                                  {/* Match Score */}
                                  <div className="text-center">
                                    <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium text-white ${getMatchScoreColor(selectedBuyer?.match_score || 0)}`}>
                                      <Target className="h-4 w-4 mr-2" />
                                      Match Score: {selectedBuyer?.match_score}%
                                    </div>
                                  </div>

                                  <Separator />

                                  {/* Contact Information */}
                                  <div>
                                    <h3 className="text-lg font-semibold text-foreground mb-3">Contact Information</h3>
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2 text-sm">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-foreground">{buyerDetails.email}</span>
                                      </div>
                                      {buyerDetails.phone && (
                                        <div className="flex items-center gap-2 text-sm">
                                          <Phone className="h-4 w-4 text-muted-foreground" />
                                          <span className="text-foreground">{buyerDetails.phone}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <Separator />

                                  {/* Buy Box Criteria */}
                                  {buyerDetails.buy_box_details && (
                                    <div>
                                      <h3 className="text-lg font-semibold text-foreground mb-3">Buy Box Criteria</h3>
                                      <div className="space-y-4">
                                        <div>
                                          <label className="text-sm font-medium text-muted-foreground">Price Range</label>
                                          <div className="flex items-center gap-2 mt-1">
                                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-foreground">
                                              {formatCurrency(buyerDetails.buy_box_details.min_price)} - {formatCurrency(buyerDetails.buy_box_details.max_price)}
                                            </span>
                                          </div>
                                        </div>

                                        {buyerDetails.buy_box_details.preferred_land_types && buyerDetails.buy_box_details.preferred_land_types.length > 0 && (
                                          <div>
                                            <label className="text-sm font-medium text-muted-foreground">Preferred Land Types</label>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                              {buyerDetails.buy_box_details.preferred_land_types.map((type: string, index: number) => (
                                                <Badge key={index} variant="secondary">{type}</Badge>
                                              ))}
                                            </div>
                                          </div>
                                        )}

                                        {buyerDetails.buy_box_details.location_preferences && buyerDetails.buy_box_details.location_preferences.length > 0 && (
                                          <div>
                                            <label className="text-sm font-medium text-muted-foreground">Location Preferences</label>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                              {buyerDetails.buy_box_details.location_preferences.map((location: string, index: number) => (
                                                <Badge key={index} variant="outline">
                                                  <MapPin className="h-3 w-3 mr-1" />
                                                  {location}
                                                </Badge>
                                              ))}
                                            </div>
                                          </div>
                                        )}

                                        {buyerDetails.buy_box_details.investment_strategy && buyerDetails.buy_box_details.investment_strategy.length > 0 && (
                                          <div>
                                            <label className="text-sm font-medium text-muted-foreground">Investment Strategy</label>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                              {buyerDetails.buy_box_details.investment_strategy.map((strategy: string, index: number) => (
                                                <Badge key={index} variant="outline">{strategy}</Badge>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-center py-8">
                                  <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                  <p className="text-muted-foreground">Unable to load buyer details.</p>
                                </div>
                              )}
                            </ScrollArea>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminMatchingBuyersSection;