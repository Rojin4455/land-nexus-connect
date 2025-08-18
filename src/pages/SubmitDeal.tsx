import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/DashboardLayout';
import AddressAutocomplete from '@/components/map/AddressAutocomplete';
import { Upload, X, FileText, Image, Video } from 'lucide-react';
import { landDealsApi, handleApiError } from '@/services/landDealsApi';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { fetchAllFormOptions } from '@/store/formOptionsSlice';
import { transformFormOptionsForSelect } from '@/services/formOptionsApi';

const SubmitDeal = () => {
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
    // Check if user is authenticated
    const userToken = localStorage.getItem('userToken');
    if (!isAuthenticated) {
      navigate('/user/login');
      return;
    }

    // Load form options
    dispatch(fetchAllFormOptions());
  }, [navigate, dispatch]);



  // Transform API data for select components
  const formOptions = {
    landTypes: transformFormOptionsForSelect(landTypes),
    utilities: transformFormOptionsForSelect(utilities),
    accessTypes: transformFormOptionsForSelect(accessTypes),
  };


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'agreed_price' || name === 'acreage' || name === 'lot_size' ? parseFloat(value) || 0 : value
    });
  };

  const handleSelectChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles = files.map((file: File) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      file: file
    }));
    
    setUploadedFiles(prev => [...prev, ...newFiles]);
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

  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (type.startsWith('video/')) return <Video className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Prepare files for upload
      const photos = uploadedFiles.filter(f => f.type.startsWith('image/')).map(f => f.file);
      const documents = uploadedFiles.filter(f => !f.type.startsWith('image/')).map(f => f.file);

      console.log("formmmm dataL ", formData)

      // Prepare API data with ALL form fields in backend expected format
      const dealData = {
        address: formData.address || '',
        latitude: formData.latitude || '',
        longitude: formData.longitude || '',
        place_id: formData.place_id || '',
        land_type: formData.land_type || '',
        landType: formData.land_type || '', // backward compatibility
        acreage: parseFloat(formData.acreage) || 0,
        zoning: formData.zoning || '',
        agreed_price: parseFloat(formData.agreed_price) || 0,
        agreedPrice: parseFloat(formData.agreed_price) || 0, // backward compatibility
        estimated_aev: parseFloat(formData.estimated_aev) || 0,
        development_costs: parseFloat(formData.development_costs) || 0,
        utilities: formData.utilities || '',
        access_type: formData.access_type || '',
        accessType: formData.access_type || '', // backward compatibility
        topography: formData.topography || '',
        environmental_factors: formData.environmental_factors || '',
        nearest_attraction: formData.nearest_attraction || '',
        description: formData.description || '',
        property_characteristics: formData.property_characteristics || [],
        location_characteristics: formData.location_characteristics || [],
        llc_name: formData.llc_name || '',
        first_name: formData.first_name || '',
        last_name: formData.last_name || '',
        phone_number: formData.phone_number || '',
        email: formData.email || '',
        under_contract: formData.under_contract || '',
        parcel_id: formData.parcel_id || '',
        lot_size: parseFloat(formData.lot_size) || 0,
        lot_size_unit: formData.lot_size_unit || 'acres',
        exit_strategy: formData.exit_strategy || '',
        extra_notes: formData.extra_notes || '',
        files: [...photos, ...documents]
      };

      // Log the complete form data for verification
      console.log('=== LAND DEAL SUBMISSION DATA ===');
      console.log('Form Data:', formData);
      console.log('Deal Data being sent to API:', dealData);
      console.log('Uploaded Files:', uploadedFiles);
      console.log('Photos:', photos.map(p => p.name));
      console.log('Documents:', documents.map(d => d.name));
      console.log('=====================================');

      const response = await landDealsApi.createLandDeal(dealData);
      
      if (response) {
        toast({
          title: "Deal submitted successfully!",
          description: `Your deal has been submitted for review.`,
          variant: "default",
        });
        navigate('/dashboard');
      } else {
        throw new Error(response.message || 'Failed to submit deal');
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast({
        title: "Submission failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout activeTab="submit">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Submit Land Deal</h1>
          <p className="text-muted-foreground">Provide detailed information about your land deal for professional review</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 form-field">
                <Label htmlFor="address" className="form-label">Lot Address / Location *</Label>
                <AddressAutocomplete
                  value={formData.address}
                  onChange={(address, coordinates) => {
                    setFormData(prev => ({
                      ...prev,
                      address,
                      latitude: coordinates?.lat,
                      longitude: coordinates?.lng,
                      place_id: coordinates?.place_id
                    }));
                  }}
                  placeholder="123 Main St, City, State, ZIP"
                  required
                  className="form-input"
                />
              </div>

              <div className="form-field">
                <Label htmlFor="land_type" className="form-label">Land Type *</Label>
                <Select value={formData.land_type} onValueChange={(value) => handleSelectChange('land_type', value)}>
                  <SelectTrigger className="form-input">
                    <SelectValue placeholder="Select land type" />
                  </SelectTrigger>
                  <SelectContent>
                    {formOptions.landTypes.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="form-field">
                <Label htmlFor="acreage" className="form-label">Acreage *</Label>
                <Input
                  id="acreage"
                  name="acreage"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 2.5"
                  value={formData.acreage}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-field">
                <Label htmlFor="lot_size" className="form-label">Lot Size *</Label>
                <div className="flex gap-2">
                  <Input
                    id="lot_size"
                    name="lot_size"
                    type="number"
                    step="0.1"
                    placeholder="e.g., 2.5"
                    value={formData.lot_size}
                    onChange={handleInputChange}
                    className="form-input flex-1"
                    required
                  />
                  <Select value={formData.lot_size_unit} onValueChange={(value) => handleSelectChange('lot_size_unit', value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="acres">Acres</SelectItem>
                      <SelectItem value="sqft">Sq Ft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="form-field">
                <Label htmlFor="zoning" className="form-label">Zoning Classification</Label>
                <Input
                  id="zoning"
                  name="zoning"
                  placeholder="e.g., R-1, C-2, M-1"
                  value={formData.zoning}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle>Financial Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="form-field">
                <Label htmlFor="agreed_price" className="form-label">Agreed/Purchase Price ($) *</Label>
                <Input
                  id="agreed_price"
                  name="agreed_price"
                  type="number"
                  placeholder="125000"
                  value={formData.agreed_price}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-field">
                <Label htmlFor="estimated_aev" className="form-label">Estimated AEV ($)</Label>
                <Input
                  id="estimated_aev"
                  name="estimated_aev"
                  type="number"
                  placeholder="150000"
                  value={formData.estimated_aev}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>

              <div className="form-field">
                <Label htmlFor="development_costs" className="form-label">Development Costs ($)</Label>
                <Input
                  id="development_costs"
                  name="development_costs"
                  type="number"
                  placeholder="25000"
                  value={formData.development_costs}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
            </CardContent>
          </Card>

          {/* Property Details */}
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle>Property Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-field">
                <Label htmlFor="utilities" className="form-label">Utilities Available *</Label>
                <Select value={formData.utilities} onValueChange={(value) => handleSelectChange('utilities', value)}>
                  <SelectTrigger className="form-input">
                    <SelectValue placeholder="Select utilities" />
                  </SelectTrigger>
                  <SelectContent>
                    {formOptions.utilities.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="form-field">
                <Label htmlFor="access_type" className="form-label">Access Type *</Label>
                <Select value={formData.access_type} onValueChange={(value) => handleSelectChange('access_type', value)}>
                  <SelectTrigger className="form-input">
                    <SelectValue placeholder="Select access type" />
                  </SelectTrigger>
                  <SelectContent>
                    {formOptions.accessTypes.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2 form-field">
                <Label htmlFor="nearest_attraction" className="form-label">Nearest Major City/Development/Attraction</Label>
                <Input
                  id="nearest_attraction"
                  name="nearest_attraction"
                  placeholder="e.g., 15 miles from Denver downtown"
                  value={formData.nearest_attraction}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>

              <div className="md:col-span-2 form-field">
                <Label htmlFor="topography" className="form-label">Topography</Label>
                <Textarea
                  id="topography"
                  name="topography"
                  placeholder="Describe the land's topography, elevation, slope, etc."
                  value={formData.topography}
                  onChange={handleInputChange}
                  className="min-h-[100px]"
                />
              </div>

              <div className="md:col-span-2 form-field">
                <Label htmlFor="environmental_factors" className="form-label">Environmental Factors</Label>
                <Textarea
                  id="environmental_factors"
                  name="environmental_factors"
                  placeholder="Any environmental concerns, wetlands, flood zones, etc."
                  value={formData.environmental_factors}
                  onChange={handleInputChange}
                  className="min-h-[100px]"
                />
              </div>

              <div className="md:col-span-2 form-field">
                <Label htmlFor="description" className="form-label">Land Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Provide a detailed description of the property..."
                  value={formData.description}
                  onChange={handleInputChange}
                  className="min-h-[120px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-field">
                <Label htmlFor="llc_name" className="form-label">LLC Name *</Label>
                <Input
                  id="llc_name"
                  name="llc_name"
                  placeholder="Your LLC Name"
                  value={formData.llc_name}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-field">
                <Label htmlFor="first_name" className="form-label">First Name *</Label>
                <Input
                  id="first_name"
                  name="first_name"
                  placeholder="John"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-field">
                <Label htmlFor="last_name" className="form-label">Last Name *</Label>
                <Input
                  id="last_name"
                  name="last_name"
                  placeholder="Doe"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-field">
                <Label htmlFor="phone_number" className="form-label">Phone Number *</Label>
                <Input
                  id="phone_number"
                  name="phone_number"
                  placeholder="(555) 123-4567"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-field">
                <Label htmlFor="email" className="form-label">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-field">
                <Label htmlFor="under_contract" className="form-label">Under Contract *</Label>
                <Select value={formData.under_contract} onValueChange={(value) => handleSelectChange('under_contract', value)}>
                  <SelectTrigger className="form-input">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="form-field">
                <Label htmlFor="parcel_id" className="form-label">Parcel ID</Label>
                <Input
                  id="parcel_id"
                  name="parcel_id"
                  placeholder="Property Parcel ID"
                  value={formData.parcel_id}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>

              <div className="form-field">
                <Label htmlFor="exit_strategy" className="form-label">Exit Strategy</Label>
                <Select value={formData.exit_strategy} onValueChange={(value) => handleSelectChange('exit_strategy', value)}>
                  <SelectTrigger className="form-input">
                    <SelectValue placeholder="Select exit strategy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="infill">Infill Lot Development</SelectItem>
                    <SelectItem value="flip">Buy & Flip</SelectItem>
                    <SelectItem value="subdivide">Subdivide & Sell</SelectItem>
                    <SelectItem value="seller_financing">Seller Financing</SelectItem>
                    <SelectItem value="rezoning">Entitlement/Rezoning</SelectItem>
                    <SelectItem value="mobile_home">Mobile Home Lot</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2 form-field">
                <Label htmlFor="extra_notes" className="form-label">Additional Notes</Label>
                <Textarea
                  id="extra_notes"
                  name="extra_notes"
                  placeholder="Any additional information about the property..."
                  value={formData.extra_notes}
                  onChange={handleInputChange}
                  className="min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle>Documents & Media</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="form-field">
                <Label className="form-label">Upload Photos/Videos/Documents</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Drag files here or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Supports: JPG, PNG, PDF, MP4, KML, CAD files (max 10MB each)
                  </p>
                  <Input
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.pdf,.mp4,.kml,.dwg,.dxf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => document.getElementById('file-upload').click()}
                  >
                    Choose Files
                  </Button>
                </div>
              </div>

              {/* Uploaded Files */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Uploaded Files ({uploadedFiles.length})</h4>
                  <div className="grid gap-2">
                    {uploadedFiles.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
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
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => navigate('/dashboard')}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="btn-primary px-8"
              disabled={isLoading}
            >
              {isLoading ? "Submitting..." : "Submit Deal for Review"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default SubmitDeal;