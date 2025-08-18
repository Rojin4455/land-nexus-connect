import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MapContainer from '@/components/map/MapContainer';
import { MapPin, DollarSign, Save } from 'lucide-react';
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
    agreedPrice: deal.agreedPrice || '',
    estimatedAEV: deal.estimatedAEV || '',
    developmentCosts: deal.developmentCosts || '',
    topography: deal.topography || '',
    environmentalFactors: deal.environmentalFactors || '',
    nearestAttraction: deal.nearestAttraction || '',
    description: deal.description || '',
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
        estimatedAEV: parseFloat(formData.estimatedAEV),
        developmentCosts: parseFloat(formData.developmentCosts),
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
              <label className="text-sm font-medium text-muted-foreground">Utilities</label>
              <Input
                value={Array.isArray(deal.utilities) ? deal.utilities.join(', ') : deal.utilities}
                disabled
                className="bg-gray-100 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Land Type</label>
              <Input
                value={deal.landType || ''}
                disabled
                className="bg-gray-100 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Access Type</label>
              <Input
                value={deal.accessType || ''}
                disabled
                className="bg-gray-100 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Submitted On</label>
              <Input
                value={new Date(deal.submittedOn).toLocaleString()}
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

            <div>
              <label className="text-sm font-medium text-muted-foreground">Estimated AEV</label>
              <Input
                type="number"
                value={formData.estimatedAEV}
                onChange={e => handleChange('estimatedAEV', e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Development Costs</label>
              <Input
                type="number"
                value={formData.developmentCosts}
                onChange={e => handleChange('developmentCosts', e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Topography</label>
              <Input
                value={formData.topography}
                onChange={e => handleChange('topography', e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Environmental Factors</label>
              <Input
                value={formData.environmentalFactors}
                onChange={e => handleChange('environmentalFactors', e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Nearest Attraction</label>
              <Input
                value={formData.nearestAttraction}
                onChange={e => handleChange('nearestAttraction', e.target.value)}
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="text-sm font-medium text-muted-foreground">Description</label>
            <Textarea
              value={formData.description}
              onChange={e => handleChange('description', e.target.value)}
            />
          </div>

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
