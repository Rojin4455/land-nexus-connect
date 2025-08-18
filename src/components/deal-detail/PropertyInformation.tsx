import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MapContainer from '@/components/map/MapContainer';
import { MapPin, DollarSign } from 'lucide-react';

interface PropertyInformationProps {
  deal: any;
  formatCurrency: (amount: number) => string;
}

const PropertyInformation = ({ deal, formatCurrency }: PropertyInformationProps) => {
  console.log("deal:", deal);

  return (
    <div className="space-y-6">
      {/* Map Section */}
      {deal.address && (
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Property Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MapContainer
              address={deal.address}
              latitude={deal.latitude}
              longitude={deal.longitude}
              height="h-80"
            />
          </CardContent>
        </Card>
      )}
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
            {deal.address && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Address</p>
                <p className="text-foreground">{deal.address}</p>
              </div>
            )}

            {deal.landType && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Land Type</p>
                <p className="text-foreground capitalize">{deal.landType}</p>
              </div>
            )}

            {deal.acreage && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Lot Size (Acreage)</p>
                <p className="text-foreground">{deal.acreage} acres</p>
              </div>
            )}

            {deal.zoning && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Zoning</p>
                <p className="text-foreground">{deal.zoning}</p>
              </div>
            )}

            {deal.utilities && deal.utilities.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Utilities</p>
                <p className="text-foreground capitalize">{deal.utilities.join(', ')}</p>
              </div>
            )}

            {deal.accessType && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Access</p>
                <p className="text-foreground capitalize">{deal.accessType.replace('-', ' ')}</p>
              </div>
            )}
          </div>

          {deal.nearestAttraction && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nearest Attraction</p>
              <p className="text-foreground">{deal.nearestAttraction}</p>
            </div>
          )}

          {deal.description && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Description</p>
              <p className="text-foreground">{deal.description}</p>
            </div>
          )}

          {deal.topography && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Topography</p>
              <p className="text-foreground">{deal.topography}</p>
            </div>
          )}

          {deal.environmentalFactors && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Environmental Factors</p>
              <p className="text-foreground">{deal.environmentalFactors}</p>
            </div>
          )}

          {deal.coach && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Assigned Coach</p>
              <p className="text-foreground">{deal.coach}</p>
            </div>
          )}

          {deal.status && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <p className="text-foreground capitalize">{deal.status}</p>
            </div>
          )}

          {deal.submittedOn && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Submitted On</p>
              <p className="text-foreground">{new Date(deal.submittedOn).toLocaleString()}</p>
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
            {deal.agreedPrice !== undefined && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Agreed Price</span>
                <span className="font-semibold text-lg">{formatCurrency(deal.agreedPrice)}</span>
              </div>
            )}
            {deal.estimatedAEV && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Estimated AEV</span>
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
