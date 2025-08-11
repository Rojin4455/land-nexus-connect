import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, DollarSign, Home, Calendar, AlertCircle } from 'lucide-react';
import { getPublicBuyBoxCriteria } from '@/services/landDealsApi';

const BuyBoxCriteria = () => {
  const { data: criteria, isLoading, error } = useQuery({
    queryKey: ['public-buybox-criteria'],
    queryFn: getPublicBuyBoxCriteria,
  });

  const criteriaArray = Array.isArray(criteria) ? criteria : [];

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
                    {criterion.buyer_name || `Buyer ${criterion.buyer}`}
                  </CardTitle>
                  <CardDescription>
                    Active since {new Date(criterion.created_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Location */}
                  {(criterion.state || criterion.county || criterion.city) && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">Location</p>
                        <p className="text-sm text-muted-foreground">
                          {[criterion.city, criterion.county, criterion.state].filter(Boolean).join(', ') || 'Any location'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Price Range */}
                  {(criterion.min_price || criterion.max_price) && (
                    <div className="flex items-start gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">Price Range</p>
                        <p className="text-sm text-muted-foreground">
                          ${criterion.min_price?.toLocaleString() || '0'} - ${criterion.max_price?.toLocaleString() || 'No limit'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Acreage */}
                  {(criterion.min_acreage || criterion.max_acreage) && (
                    <div className="flex items-start gap-2">
                      <Home className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">Acreage</p>
                        <p className="text-sm text-muted-foreground">
                          {criterion.min_acreage || '0'} - {criterion.max_acreage || 'No limit'} acres
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Property Types */}
                  {criterion.property_types && criterion.property_types.length > 0 && (
                    <div>
                      <p className="font-medium text-sm mb-2">Property Types</p>
                      <div className="flex flex-wrap gap-1">
                        {criterion.property_types.map((type: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Additional Info */}
                  {criterion.additional_info && (
                    <div>
                      <p className="font-medium text-sm mb-1">Additional Requirements</p>
                      <p className="text-sm text-muted-foreground">
                        {criterion.additional_info}
                      </p>
                    </div>
                  )}
                </CardContent>
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
    </DashboardLayout>
  );
};

export default BuyBoxCriteria;