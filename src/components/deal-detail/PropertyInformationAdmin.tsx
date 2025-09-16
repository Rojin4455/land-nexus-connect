import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MapContainer from '@/components/map/MapContainer';
import { MapPin, DollarSign, Save, User, Phone, Mail, Building } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { landDealsApi, handleApiError } from '@/services/landDealsApi';

interface PropertyInformationProps {
  deal: any;
  formatCurrency: (amount: number) => string;
}

const PropertyInformationAdmin = ({ deal, formatCurrency }: PropertyInformationProps) => {
  const [formData, setFormData] = useState({
    acreage: deal.acreage || '',
    zoning: deal.zoning || '',
    agreedPrice: deal.agreed_price || '',
    description: deal.description || '',
    extra_notes: deal.extra_notes || '',
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        acreage: parseFloat(formData.acreage),
        agreedPrice: parseFloat(formData.agreedPrice),
      };

      const response = await landDealsApi.admin.updatePropertyDetails(deal.id, payload);
      if (response.status === 200) {
        toast({ title: 'Property updated', description: 'Details saved successfully.' });
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      const message = handleApiError(error);
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Contact Information */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Building className="h-4 w-4" />
                LLC Name
              </label>
              <Input value={deal.llc_name || 'N/A'} disabled className="bg-gray-100 cursor-not-allowed" />
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Name</label>
              <Input 
                value={`${deal.first_name || ''} ${deal.last_name || ''}`.trim() || 'N/A'} 
                disabled 
                className="bg-gray-100 cursor-not-allowed" 
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Phone className="h-4 w-4" />
                Phone Number
              </label>
              <Input value={deal.phone_number || 'N/A'} disabled className="bg-gray-100 cursor-not-allowed" />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Mail className="h-4 w-4" />
                Email
              </label>
              <Input value={deal.email || 'N/A'} disabled className="bg-gray-100 cursor-not-allowed" />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Username</label>
              <Input value={deal.user_detail?.username || 'N/A'} disabled className="bg-gray-100 cursor-not-allowed" />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">User Email</label>
              <Input value={deal.user_detail?.email || 'N/A'} disabled className="bg-gray-100 cursor-not-allowed" />
            </div>
          </div>
        </CardContent>
      </Card>

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

      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Property Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Static fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Address</label>
              <Input value={deal.address} disabled className="bg-gray-100 cursor-not-allowed" />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Land Type</label>
              <Input
                value={deal.land_type_detail?.display_name || ''}
                disabled
                className="bg-gray-100 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Utilities</label>
              <Input
                value={deal.utilities_detail?.display_name || ''}
                disabled
                className="bg-gray-100 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Access Type</label>
              <Input
                value={deal.access_type_detail?.display_name || ''}
                disabled
                className="bg-gray-100 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Lot Size</label>
              <Input
                value={`${deal.lot_size} ${deal.lot_size_unit}`}
                disabled
                className="bg-gray-100 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Exit Strategy</label>
              <Input
                value={deal.exit_strategy || ''}
                disabled
                className="bg-gray-100 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Under Contract</label>
              <Input
                value={deal.under_contract === 'yes' ? 'Yes' : 'No'}
                disabled
                className="bg-gray-100 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Created On</label>
              <Input
                value={new Date(deal.created_at).toLocaleString()}
                disabled
                className="bg-gray-100 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
              <Input
                value={new Date(deal.updated_at).toLocaleString()}
                disabled
                className="bg-gray-100 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Editable fields */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Acreage</label>
              <Input
                type="number"
                value={formData.acreage}
                onChange={e => handleChange('acreage', e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Zoning</label>
              <Input
                value={formData.zoning}
                onChange={e => handleChange('zoning', e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Agreed Price</label>
              <Input
                type="number"
                value={formData.agreedPrice}
                onChange={e => handleChange('agreedPrice', e.target.value)}
              />
            </div>
          </div>

          {formData.description && (
            <div className="mt-4">
              <label className="text-sm font-medium text-muted-foreground">Description</label>
              <Textarea
                value={formData.description}
                onChange={e => handleChange('description', e.target.value)}
              />
            </div>
          )}

          {formData.extra_notes && (
            <div className="mt-4">
              <label className="text-sm font-medium text-muted-foreground">Extra Notes</label>
              <Textarea
                value={formData.extra_notes}
                onChange={e => handleChange('extra_notes', e.target.value)}
              />
            </div>
          )}

          <Button onClick={handleSave} disabled={isSaving} className="mt-4">
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PropertyInformationAdmin;
