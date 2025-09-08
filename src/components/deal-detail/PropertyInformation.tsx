import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MapContainer from '@/components/map/MapContainer';
import { MapPin, DollarSign } from 'lucide-react';

interface PropertyInformationProps {
  deal: any;
  formatCurrency: (amount: number) => string;
}

const PropertyInformation = ({ deal, formatCurrency }: PropertyInformationProps) => {
  // Convert string coordinates to numbers for MapContainer
  const latitude = deal.latitude ? parseFloat(deal.latitude) : undefined;
  const longitude = deal.longitude ? parseFloat(deal.longitude) : undefined;

  return (
    <div className="space-y-6">
      {/* Map Section */}
      {deal.address && latitude && longitude && (
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
              latitude={latitude}
              longitude={longitude}
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

            {deal.land_type_detail && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Land Type</p>
                <p className="text-foreground">{deal.land_type_detail.display_name}</p>
              </div>
            )}

            {deal.acreage && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Acreage</p>
                <p className="text-foreground">{deal.acreage} acres</p>
              </div>
            )}

            {deal.lot_size && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Lot Size</p>
                <p className="text-foreground">{deal.lot_size} {deal.lot_size_unit || 'sqft'}</p>
              </div>
            )}

            {deal.zoning && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Zoning</p>
                <p className="text-foreground">{deal.zoning}</p>
              </div>
            )}

            {deal.utilities_detail && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Utilities</p>
                <p className="text-foreground">{deal.utilities_detail.display_name}</p>
              </div>
            )}

            {deal.access_type_detail && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Access Type</p>
                <p className="text-foreground">{deal.access_type_detail.display_name}</p>
              </div>
            )}

            {deal.exit_strategy && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Exit Strategy</p>
                <p className="text-foreground capitalize">{deal.exit_strategy}</p>
              </div>
            )}
          </div>

          {deal.description && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Description</p>
              <p className="text-foreground">{deal.description}</p>
            </div>
          )}

          {deal.extra_notes && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Extra Notes</p>
              <p className="text-foreground">{deal.extra_notes}</p>
            </div>
          )}

          {deal.parcel_id && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Parcel ID</p>
              <p className="text-foreground">{deal.parcel_id}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {deal.status && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <p className="text-foreground capitalize">{deal.status}</p>
              </div>
            )}

            {deal.under_contract && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Under Contract</p>
                <p className="text-foreground capitalize">{deal.under_contract}</p>
              </div>
            )}
          </div>

          {deal.created_at && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Submitted On</p>
              <p className="text-foreground">{new Date(deal.created_at).toLocaleString()}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Information */}
      {(deal.first_name || deal.last_name || deal.phone_number || deal.email || deal.llc_name) && (
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {deal.llc_name && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">LLC Name</p>
                  <p className="text-foreground">{deal.llc_name}</p>
                </div>
              )}

              {(deal.first_name || deal.last_name) && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Name</p>
                  <p className="text-foreground">{deal.first_name} {deal.last_name}</p>
                </div>
              )}

              {deal.phone_number && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p className="text-foreground">{deal.phone_number}</p>
                </div>
              )}

              {deal.email && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-foreground">{deal.email}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Financial Details */}
      {deal.agreed_price && (
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
                <span className="text-muted-foreground">Agreed Price</span>
                <span className="font-semibold text-lg">{formatCurrency(parseFloat(deal.agreed_price))}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Files Section */}
      {deal.files && deal.files.length > 0 && (
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Attachments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {deal.files.map((file: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm">{file.original_name}</span>
                  <a 
                    href={file.file} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm"
                  >
                    Download
                  </a>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PropertyInformation;
