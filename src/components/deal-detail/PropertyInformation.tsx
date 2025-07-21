import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, DollarSign } from 'lucide-react';

interface PropertyInformationProps {
  deal: any;
  formatCurrency: (amount: number) => string;
}

const PropertyInformation = ({ deal, formatCurrency }: PropertyInformationProps) => {
  return (
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
    </div>
  );
};

export default PropertyInformation;