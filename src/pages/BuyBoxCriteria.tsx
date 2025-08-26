import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, DollarSign, Home, Calendar, AlertCircle, Send, Users, Target, Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import { getPublicBuyBoxCriteria } from '@/services/landDealsApi';
import SubmitDealModal from '@/components/SubmitDealModal';

const BuyBoxCriteria = () => {
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [currentCriteriaIndex, setCurrentCriteriaIndex] = useState(0);
  
  const { data: criteria, isLoading, error } = useQuery({
    queryKey: ['public-buybox-criteria'],
    queryFn: getPublicBuyBoxCriteria,
  });

  const criteriaArray = (criteria as any)?.buy_box_criteria || [];
  const totalActiveBuyers = (criteria as any)?.total_active_buyers || 0;
  const summaryStats = (criteria as any)?.summary_stats;

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
            {totalActiveBuyers > 0 && (
              <div className="flex items-center gap-2 mt-4">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">
                  {totalActiveBuyers} Active Buyers Looking for Land Deals
                </span>
              </div>
            )}
          </div>

        {criteriaArray && criteriaArray.length > 0 ? (
          criteriaArray.length === 1 ? (
            // Single criterion - show as single card
            <div className="max-w-2xl mx-auto">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    {criteriaArray[0].asset_type || 'Mixed'} Investment Criteria
                  </CardTitle>
                  <CardDescription>
                    Last updated {new Date(criteriaArray[0].criteria_last_updated).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* ... keep existing code for criterion content */}
                  {criteriaArray[0].location_preferences && 
                   criteriaArray[0].location_preferences !== "No specific location preference" && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">Location Preferences</p>
                        <p className="text-sm text-muted-foreground">
                          {criteriaArray[0].location_preferences}
                        </p>
                      </div>
                    </div>
                  )}

                  {criteriaArray[0].price_range?.formatted && (
                    <div className="flex items-start gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">Price Range</p>
                        <p className="text-sm text-muted-foreground">
                          {criteriaArray[0].price_range.formatted}
                        </p>
                      </div>
                    </div>
                  )}

                  {criteriaArray[0].lot_size_range?.formatted && (
                    <div className="flex items-start gap-2">
                      <Home className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">Lot Size</p>
                        <p className="text-sm text-muted-foreground">
                          {criteriaArray[0].lot_size_range.formatted}
                        </p>
                      </div>
                    </div>
                  )}

                  {criteriaArray[0].property_types?.length > 0 && (
                    <div>
                      <p className="font-medium text-sm mb-2">Property Types</p>
                      <div className="flex flex-wrap gap-1">
                        {criteriaArray[0].property_types.map((type: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {criteriaArray[0].investment_strategies?.length > 0 && (
                    <div>
                      <p className="font-medium text-sm mb-2">Investment Strategies</p>
                      <div className="flex flex-wrap gap-1">
                        {criteriaArray[0].investment_strategies.map((strategy: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {strategy}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {criteriaArray[0].exit_strategies?.length > 0 && (
                    <div>
                      <p className="font-medium text-sm mb-2">Exit Strategies</p>
                      <div className="flex flex-wrap gap-1">
                        {criteriaArray[0].exit_strategies.map((strategy: string, index: number) => (
                          <Badge key={index} variant="default" className="text-xs">
                            {strategy}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {(criteriaArray[0].requirements?.strict_requirements?.length > 0 ||
                    criteriaArray[0].requirements?.location_characteristics?.length > 0 ||
                    criteriaArray[0].requirements?.property_characteristics?.length > 0) && (
                    <div className="flex items-start gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">Requirements</p>
                        <p className="text-sm text-muted-foreground">
                          {criteriaArray[0].summary?.total_requirements || 0} specific requirements
                        </p>
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
            </div>
          ) : (
            // Multiple criteria - show as gallery with navigation
            <div className="space-y-4">
              {/* Navigation indicators */}
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentCriteriaIndex(Math.max(0, currentCriteriaIndex - 1))}
                  disabled={currentCriteriaIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                <div className="flex items-center gap-2">
                  {criteriaArray.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentCriteriaIndex(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentCriteriaIndex 
                          ? 'bg-primary' 
                          : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                      }`}
                    />
                  ))}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentCriteriaIndex(Math.min(criteriaArray.length - 1, currentCriteriaIndex + 1))}
                  disabled={currentCriteriaIndex === criteriaArray.length - 1}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Current criterion display */}
              <div className="max-w-2xl mx-auto">
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      {criteriaArray[currentCriteriaIndex].asset_type || 'Mixed'} Investment Criteria
                      <span className="text-sm text-muted-foreground font-normal">
                        ({currentCriteriaIndex + 1} of {criteriaArray.length})
                      </span>
                    </CardTitle>
                    <CardDescription>
                      Last updated {new Date(criteriaArray[currentCriteriaIndex].criteria_last_updated).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* ... keep existing code for criterion content */}
                    {criteriaArray[currentCriteriaIndex].location_preferences && 
                     criteriaArray[currentCriteriaIndex].location_preferences !== "No specific location preference" && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">Location Preferences</p>
                          <p className="text-sm text-muted-foreground">
                            {criteriaArray[currentCriteriaIndex].location_preferences}
                          </p>
                        </div>
                      </div>
                    )}

                    {criteriaArray[currentCriteriaIndex].price_range?.formatted && (
                      <div className="flex items-start gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">Price Range</p>
                          <p className="text-sm text-muted-foreground">
                            {criteriaArray[currentCriteriaIndex].price_range.formatted}
                          </p>
                        </div>
                      </div>
                    )}

                    {criteriaArray[currentCriteriaIndex].lot_size_range?.formatted && (
                      <div className="flex items-start gap-2">
                        <Home className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">Lot Size</p>
                          <p className="text-sm text-muted-foreground">
                            {criteriaArray[currentCriteriaIndex].lot_size_range.formatted}
                          </p>
                        </div>
                      </div>
                    )}

                    {criteriaArray[currentCriteriaIndex].property_types?.length > 0 && (
                      <div>
                        <p className="font-medium text-sm mb-2">Property Types</p>
                        <div className="flex flex-wrap gap-1">
                          {criteriaArray[currentCriteriaIndex].property_types.map((type: string, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {type}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {criteriaArray[currentCriteriaIndex].investment_strategies?.length > 0 && (
                      <div>
                        <p className="font-medium text-sm mb-2">Investment Strategies</p>
                        <div className="flex flex-wrap gap-1">
                          {criteriaArray[currentCriteriaIndex].investment_strategies.map((strategy: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {strategy}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {criteriaArray[currentCriteriaIndex].exit_strategies?.length > 0 && (
                      <div>
                        <p className="font-medium text-sm mb-2">Exit Strategies</p>
                        <div className="flex flex-wrap gap-1">
                          {criteriaArray[currentCriteriaIndex].exit_strategies.map((strategy: string, index: number) => (
                            <Badge key={index} variant="default" className="text-xs">
                              {strategy}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {(criteriaArray[currentCriteriaIndex].requirements?.strict_requirements?.length > 0 ||
                      criteriaArray[currentCriteriaIndex].requirements?.location_characteristics?.length > 0 ||
                      criteriaArray[currentCriteriaIndex].requirements?.property_characteristics?.length > 0) && (
                      <div className="flex items-start gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">Requirements</p>
                          <p className="text-sm text-muted-foreground">
                            {criteriaArray[currentCriteriaIndex].summary?.total_requirements || 0} specific requirements
                          </p>
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
              </div>
            </div>
          )
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