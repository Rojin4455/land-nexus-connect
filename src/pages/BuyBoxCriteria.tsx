import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, DollarSign, Home, Calendar, AlertCircle, Send } from 'lucide-react';
import { getPublicBuyBoxCriteria } from '@/services/landDealsApi';
import SubmitDealModal from '@/components/SubmitDealModal';

const BuyBoxCriteria = () => {
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  
  const { data: criteria, isLoading, error } = useQuery({
    queryKey: ['public-buybox-criteria'],
    queryFn: getPublicBuyBoxCriteria,
  });

  const criteriaArray = (criteria as any)?.buy_box_criteria || [];

  if (isLoading) {
    return (
      <DashboardLayout activeTab="criteria">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Buy Box Criteria</h1>
            <p className="text-muted-foreground mt-2">
              Browse active investment criteria from our buyers
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout activeTab="criteria">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Buy Box Criteria</h1>
            <p className="text-muted-foreground mt-2">
              Browse active investment criteria from our buyers
            </p>
          </div>
          
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load buy box criteria. Please try again later.
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeTab="criteria">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Buy Box Criteria</h1>
          <p className="text-muted-foreground mt-2">
            Browse active investment criteria from our buyers
          </p>
        </div>

        {criteriaArray && criteriaArray.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {criteriaArray.map((criterion: any) => (
              <Card key={criterion.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="h-5 w-5 text-primary" />
                    {criterion.asset_type || 'Mixed'} Buyer #{criterion.id}
                  </CardTitle>
                  <CardDescription>
                    Updated {new Date(criterion.criteria_updated).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Asset Type */}
                  {criterion.asset_type && (
                    <div className="flex items-start gap-2">
                      <Home className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">Asset Type</p>
                        <p className="text-sm text-muted-foreground">
                          {criterion.asset_type}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Location */}
                  {(criterion.location_preferences?.states?.length > 0 || 
                    criterion.location_preferences?.counties?.length > 0 || 
                    criterion.location_preferences?.cities?.length > 0) && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">Location Preferences</p>
                        <div className="text-sm text-muted-foreground space-y-1">
                          {criterion.location_preferences?.cities?.length > 0 && (
                            <p>Cities: {criterion.location_preferences.cities.slice(0, 3).join(', ')}{criterion.location_preferences.cities.length > 3 && ` +${criterion.location_preferences.cities.length - 3} more`}</p>
                          )}
                          {criterion.location_preferences?.counties?.length > 0 && (
                            <p>Counties: {criterion.location_preferences.counties.slice(0, 2).join(', ')}{criterion.location_preferences.counties.length > 2 && ` +${criterion.location_preferences.counties.length - 2} more`}</p>
                          )}
                          {criterion.location_preferences?.states?.length > 0 && (
                            <p>States: {criterion.location_preferences.states.join(', ')}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Price Range */}
                  {(criterion.price_range?.min || criterion.price_range?.max) && (
                    <div className="flex items-start gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">Price Range</p>
                        <p className="text-sm text-muted-foreground">
                          ${criterion.price_range?.min?.toLocaleString() || '0'} - ${criterion.price_range?.max?.toLocaleString() || 'No limit'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Lot Size */}
                  {(criterion.lot_size_range?.min || criterion.lot_size_range?.max) && (
                    <div className="flex items-start gap-2">
                      <Home className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">Lot Size</p>
                        <p className="text-sm text-muted-foreground">
                          {criterion.lot_size_range?.min || '0'} - {criterion.lot_size_range?.max || 'No limit'} acres
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Property Types */}
                  {((criterion.property_types?.house_property_types?.length > 0) || 
                    (criterion.property_types?.land_property_types?.length > 0)) && (
                    <div>
                      <p className="font-medium text-sm mb-2">Property Types</p>
                      <div className="flex flex-wrap gap-1">
                        {criterion.property_types?.house_property_types?.map((type: string, index: number) => (
                          <Badge key={`house-${index}`} variant="secondary" className="text-xs">
                            {type}
                          </Badge>
                        ))}
                        {criterion.property_types?.land_property_types?.map((type: string, index: number) => (
                          <Badge key={`land-${index}`} variant="outline" className="text-xs">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Investment Strategies */}
                  {((criterion.investment_strategies?.house_strategies?.length > 0) || 
                    (criterion.investment_strategies?.land_strategies?.length > 0)) && (
                    <div>
                      <p className="font-medium text-sm mb-2">Investment Strategies</p>
                      <div className="flex flex-wrap gap-1">
                        {criterion.investment_strategies?.house_strategies?.map((strategy: string, index: number) => (
                          <Badge key={`house-strategy-${index}`} variant="secondary" className="text-xs">
                            {strategy}
                          </Badge>
                        ))}
                        {criterion.investment_strategies?.land_strategies?.map((strategy: string, index: number) => (
                          <Badge key={`land-strategy-${index}`} variant="outline" className="text-xs">
                            {strategy}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
                <div className="p-6 pt-0">
                  <Button 
                    onClick={() => setIsSubmitModalOpen(true)}
                    className="w-full"
                    size="sm"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Submit Deal
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Criteria Available</h3>
              <p className="text-muted-foreground">
                There are currently no active buy box criteria available.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
      
      <SubmitDealModal 
        open={isSubmitModalOpen}
        onOpenChange={setIsSubmitModalOpen}
      />
    </DashboardLayout>
  );
};

export default BuyBoxCriteria;