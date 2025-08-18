import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import AddressAutocomplete from '@/components/map/AddressAutocomplete';
import { Upload, X, FileText, Image, Video } from 'lucide-react';
import { landDealsApi, handleApiError } from '@/services/landDealsApi';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { fetchAllFormOptions } from '@/store/formOptionsSlice';
import { transformFormOptionsForSelect } from '@/services/formOptionsApi';

interface SubmitDealModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SubmitDealModal = ({ open, onOpenChange }: SubmitDealModalProps) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  const { utilities, landTypes, accessTypes, loading: formOptionsLoading } = useAppSelector((state) => state.formOptions);
  const [formData, setFormData] = useState({
    address: '',
    latitude: null,
    longitude: null,
    place_id: null,
    land_type: '',
    acreage: '',
    zoning: '',
    agreed_price: '',
    estimated_aev: '',
    development_costs: '',
    utilities: '',
    access_type: '',
    topography: '',
    environmental_factors: '',
    nearest_attraction: '',
    description: '',
    property_characteristics: [],
    location_characteristics: [],
    llc_name: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    email: '',
    under_contract: '',
    parcel_id: '',
    lot_size: '',
    lot_size_unit: 'acres',
    exit_strategy: '',
    extra_notes: ''
  });

  useEffect(() => {
    if (!isAuthenticated) {
      onOpenChange(false);
      navigate('/user/login');
      return;
    }

    dispatch(fetchAllFormOptions());
  }, [dispatch, isAuthenticated, navigate, onOpenChange]);

  const utilitiesOptions = utilities ? transformFormOptionsForSelect(utilities) : [];
  const landTypesOptions = landTypes ? transformFormOptionsForSelect(landTypes) : [];
  const accessTypesOptions = accessTypes ? transformFormOptionsForSelect(accessTypes) : [];

  const propertyCharacteristicsOptions = [
    'Driveway', 'Wood Frame', 'City Water', 'Solar Panels', 'Pool', 'Garage', 'Fence'
  ];

  const locationCharacteristicsOptions = [
    'Flood Zone', 'HOA Community', 'Near School', 'Near Shopping', 'Rural Area', 'Urban Area'
  ];

  const exitStrategyOptions = [
    { value: 'infill', label: 'Infill Lot Development' },
    { value: 'flip', label: 'Buy & Flip' },
    { value: 'subdivide', label: 'Subdivide & Sell' },
    { value: 'seller_financing', label: 'Seller Financing' },
    { value: 'rezoning', label: 'Entitlement/Rezoning' },
    { value: 'mobile_home', label: 'Mobile Home Lot' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log(`Modal field updated: ${name} = "${value}"`);
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (fieldName, value, checked) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: checked 
        ? [...prev[fieldName], value]
        : prev[fieldName].filter(item => item !== value)
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newFiles = files.map(file => ({
      id: Date.now() + Math.random(),
      file,
      name: file.name,
      size: file.size,
      type: file.type
    }));
    setUploadedFiles(prev => [...prev, ...newFiles] as any);
  };

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (fileType.startsWith('video/')) return <Video className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const dealData = {
        address: formData.address,
        latitude: formData.latitude?.toString() || '',
        longitude: formData.longitude?.toString() || '',
        place_id: formData.place_id || '',
        // New field names
        land_type: formData.land_type,
        agreed_price: parseFloat(formData.agreed_price) || 0,
        estimated_aev: parseFloat(formData.estimated_aev) || 0,
        development_costs: parseFloat(formData.development_costs) || 0,
        access_type: formData.access_type,
        environmental_factors: formData.environmental_factors,
        nearest_attraction: formData.nearest_attraction,
        property_characteristics: formData.property_characteristics,
        location_characteristics: formData.location_characteristics,
        llc_name: formData.llc_name,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone_number: formData.phone_number,
        email: formData.email,
        under_contract: formData.under_contract,
        parcel_id: formData.parcel_id,
        lot_size: parseFloat(formData.lot_size) || 0,
        lot_size_unit: formData.lot_size_unit,
        exit_strategy: formData.exit_strategy,
        extra_notes: formData.extra_notes,
        // Backward compatibility with old API
        landType: formData.land_type,
        agreedPrice: parseFloat(formData.agreed_price) || 0,
        estimatedAEV: formData.estimated_aev,
        developmentCosts: formData.development_costs,
        accessType: formData.access_type,
        environmentalFactors: formData.environmental_factors,
        nearestAttraction: formData.nearest_attraction,
        // Common fields
        acreage: parseFloat(formData.acreage) || 0,
        zoning: formData.zoning,
        utilities: formData.utilities,
        topography: formData.topography,
        description: formData.description,
        files: uploadedFiles.map(f => f.file)
      };

      await landDealsApi.createLandDeal(dealData);
      
      toast({
        title: "Success!",
        description: "Your land deal has been submitted for review.",
      });

      // Reset form
      setFormData({
        address: '',
        latitude: null,
        longitude: null,
        place_id: null,
        land_type: '',
        acreage: '',
        zoning: '',
        agreed_price: '',
        estimated_aev: '',
        development_costs: '',
        utilities: '',
        access_type: '',
        topography: '',
        environmental_factors: '',
        nearest_attraction: '',
        description: '',
        property_characteristics: [],
        location_characteristics: [],
        llc_name: '',
        first_name: '',
        last_name: '',
        phone_number: '',
        email: '',
        under_contract: '',
        parcel_id: '',
        lot_size: '',
        lot_size_unit: 'acres',
        exit_strategy: '',
        extra_notes: ''
      });
      setUploadedFiles([]);
      onOpenChange(false);

    } catch (error) {
      console.error('Error submitting deal:', error);
      const errorMessage = handleApiError(error);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit New Deal</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    placeholder="Enter first name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    placeholder="Enter last name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone_number">Phone Number</Label>
                  <Input
                    id="phone_number"
                    name="phone_number"
                    placeholder="Enter phone number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="llc_name">LLC Name</Label>
                <Input
                  id="llc_name"
                  name="llc_name"
                  placeholder="Enter LLC name"
                  value={formData.llc_name}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Property Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Property Address</Label>
                <AddressAutocomplete
                  value={formData.address}
                  onChange={(address, locationData) => {
                    setFormData(prev => ({
                      ...prev,
                      address,
                      latitude: locationData?.lat || null,
                      longitude: locationData?.lng || null,
                      place_id: locationData?.place_id || null
                    }));
                  }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="land_type">Land Type</Label>
                  <Select value={formData.land_type} onValueChange={(value) => handleSelectChange('land_type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select land type" />
                    </SelectTrigger>
                    <SelectContent>
                      {landTypesOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="acreage">Acreage</Label>
                  <Input
                    id="acreage"
                    name="acreage"
                    type="number"
                    step="0.01"
                    placeholder="Enter acreage"
                    value={formData.acreage}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zoning">Zoning</Label>
                  <Input
                    id="zoning"
                    name="zoning"
                    placeholder="Enter zoning information"
                    value={formData.zoning}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lot_size">Lot Size</Label>
                  <Input
                    id="lot_size"
                    name="lot_size"
                    type="number"
                    step="0.01"
                    placeholder="Enter lot size"
                    value={formData.lot_size}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lot_size_unit">Lot Size Unit</Label>
                  <Select value={formData.lot_size_unit} onValueChange={(value) => handleSelectChange('lot_size_unit', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="acres">Acres</SelectItem>
                      <SelectItem value="sqft">Square Feet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="parcel_id">Parcel ID (Optional)</Label>
                  <Input
                    id="parcel_id"
                    name="parcel_id"
                    placeholder="Enter parcel ID"
                    value={formData.parcel_id}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="under_contract">Under Contract?</Label>
                  <Select value={formData.under_contract} onValueChange={(value) => handleSelectChange('under_contract', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="agreed_price">Agreed Price ($)</Label>
                  <Input
                    id="agreed_price"
                    name="agreed_price"
                    type="number"
                    step="0.01"
                    placeholder="Enter agreed price"
                    value={formData.agreed_price}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimated_aev">Estimated AEV ($)</Label>
                  <Input
                    id="estimated_aev"
                    name="estimated_aev"
                    type="number"
                    step="0.01"
                    placeholder="Enter estimated AEV"
                    value={formData.estimated_aev}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="development_costs">Development Costs ($)</Label>
                  <Input
                    id="development_costs"
                    name="development_costs"
                    type="number"
                    step="0.01"
                    placeholder="Enter development costs"
                    value={formData.development_costs}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="exit_strategy">Exit Strategy</Label>
                <Select value={formData.exit_strategy} onValueChange={(value) => handleSelectChange('exit_strategy', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select exit strategy" />
                  </SelectTrigger>
                  <SelectContent>
                    {exitStrategyOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Property Details */}
          <Card>
            <CardHeader>
              <CardTitle>Property Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="utilities">Utilities</Label>
                  <Select value={formData.utilities} onValueChange={(value) => handleSelectChange('utilities', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select utilities" />
                    </SelectTrigger>
                    <SelectContent>
                      {utilitiesOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="access_type">Access Type</Label>
                  <Select value={formData.access_type} onValueChange={(value) => handleSelectChange('access_type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select access type" />
                    </SelectTrigger>
                    <SelectContent>
                      {accessTypesOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="topography">Topography</Label>
                  <Input
                    id="topography"
                    name="topography"
                    placeholder="Describe topography"
                    value={formData.topography}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="environmental_factors">Environmental Factors</Label>
                  <Input
                    id="environmental_factors"
                    name="environmental_factors"
                    placeholder="Environmental considerations"
                    value={formData.environmental_factors}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nearest_attraction">Nearest Attraction</Label>
                <Input
                  id="nearest_attraction"
                  name="nearest_attraction"
                  placeholder="Describe nearest attraction"
                  value={formData.nearest_attraction}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Provide a detailed description of the property"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Characteristics */}
          <Card>
            <CardHeader>
              <CardTitle>Property & Location Characteristics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Property Characteristics</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {propertyCharacteristicsOptions.map(characteristic => (
                    <div key={characteristic} className="flex items-center space-x-2">
                      <Checkbox
                        id={`property-${characteristic}`}
                        checked={formData.property_characteristics.includes(characteristic)}
                        onCheckedChange={(checked) => 
                          handleCheckboxChange('property_characteristics', characteristic, checked)
                        }
                      />
                      <Label 
                        htmlFor={`property-${characteristic}`}
                        className="text-sm font-normal"
                      >
                        {characteristic}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Location Characteristics</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {locationCharacteristicsOptions.map(characteristic => (
                    <div key={characteristic} className="flex items-center space-x-2">
                      <Checkbox
                        id={`location-${characteristic}`}
                        checked={formData.location_characteristics.includes(characteristic)}
                        onCheckedChange={(checked) => 
                          handleCheckboxChange('location_characteristics', characteristic, checked)
                        }
                      />
                      <Label 
                        htmlFor={`location-${characteristic}`}
                        className="text-sm font-normal"
                      >
                        {characteristic}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="extra_notes">Extra Notes</Label>
                <Textarea
                  id="extra_notes"
                  name="extra_notes"
                  placeholder="Any additional information or notes about the property"
                  value={formData.extra_notes}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Files</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                <div className="mt-4">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium">
                      Upload photos and documents
                    </span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      multiple
                      accept="image/*,application/pdf,.doc,.docx"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Uploaded Files</h4>
                  {uploadedFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between bg-muted/50 p-3 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getFileIcon(file.type)}
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Submitting...' : 'Submit Deal for Review'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SubmitDealModal;