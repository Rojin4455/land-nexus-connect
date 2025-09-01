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
    city: '',
    county: '',
    land_type: '',
    acreage: '',
    zoning: '',
    agreed_price: '',
    estimated_aev: '',
    development_costs: '',
    utilities: '',
    access_type: '',
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

  // Hardcoded land types as per requirements
  const landTypeOptions = [
    { value: 'residential_vacant', label: 'Residential Vacant' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'agricultural', label: 'Agricultural' },
    { value: 'recreational', label: 'Recreational' },
    { value: 'waterfront', label: 'Waterfront' }
  ];

  // Validation functions
  const validatePhone = (phone) => {
    const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/;
    return phoneRegex.test(phone);
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Extract city and county from address
  const extractLocationFromAddress = (address) => {
    const parts = address.split(',');
    if (parts.length >= 3) {
      const city = parts[1]?.trim() || '';
      const countyState = parts[2]?.trim() || '';
      const county = countyState.split(' ')[0] || '';
      return { city, county };
    }
    return { city: '', county: '' };
  };


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log(`Field updated: ${name} = "${value}"`);
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
    
    // Conditional validation: address or parcel ID required
    if (!formData.address.trim() && !formData.parcel_id.trim()) {
      toast({
        title: "Validation Error",
        description: "Either Sellers Property FULL Address or Parcel ID/APN is required.",
        variant: "destructive",
      });
      return;
    }

    // Validate phone number format
    if (formData.phone_number && !validatePhone(formData.phone_number)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid phone number in format (XXX) XXX-XXXX",
        variant: "destructive",
      });
      return;
    }

    // Validate email format
    if (formData.email && !validateEmail(formData.email)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

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
        city: formData.city || '',
        county: formData.county || '',
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
          {/* Contact Information */}
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-field">
                <Label htmlFor="llc_name" className="form-label">Your LLC Name *</Label>
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
                <Label htmlFor="first_name" className="form-label">Your First Name *</Label>
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
                <Label htmlFor="last_name" className="form-label">Your Last Name *</Label>
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
                <Label htmlFor="phone_number" className="form-label">Your Phone Number *</Label>
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

              <div className="md:col-span-2 form-field">
                <Label htmlFor="email" className="form-label">Your Email Address *</Label>
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
            </CardContent>
          </Card>

          {/* Property Deal Details */}
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle>Property Deal Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-field">
                <Label htmlFor="under_contract" className="form-label">Under Contract? *</Label>
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
                <Label htmlFor="agreed_price" className="form-label">Agreed Price with Seller *</Label>
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

              <div className="md:col-span-2 form-field">
                <Label htmlFor="address" className="form-label">Sellers Property FULL Address</Label>
                <AddressAutocomplete
                  value={formData.address}
                  onChange={(address, coordinates) => {
                    const location = extractLocationFromAddress(address);
                    setFormData(prev => ({
                      ...prev,
                      address,
                      latitude: coordinates?.lat,
                      longitude: coordinates?.lng,
                      place_id: coordinates?.place_id,
                      city: location.city,
                      county: location.county
                    }));
                  }}
                  placeholder="123 Main St, City, State, ZIP"
                  className="form-input"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  If left blank, Parcel ID or APN becomes required
                </p>
              </div>

              <div className="form-field">
                <Label htmlFor="parcel_id" className="form-label">Parcel ID or APN</Label>
                <Input
                  id="parcel_id"
                  name="parcel_id"
                  placeholder="Property Parcel ID"
                  value={formData.parcel_id}
                  onChange={handleInputChange}
                  className="form-input"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Required if address is not provided
                </p>
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
                <Label htmlFor="land_type" className="form-label">Specific Type of Land *</Label>
                <Select value={formData.land_type} onValueChange={(value) => handleSelectChange('land_type', value)}>
                  <SelectTrigger className="form-input">
                    <SelectValue placeholder="Select land type" />
                  </SelectTrigger>
                  <SelectContent>
                    {landTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="form-field">
                <Label htmlFor="exit_strategy" className="form-label">Exit Strategy (Land) *</Label>
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
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-field">
                <Label htmlFor="city" className="form-label">Property City</Label>
                <Input
                  id="city"
                  name="city"
                  placeholder="Auto-filled from address"
                  value={formData.city}
                  className="form-input bg-muted"
                  readOnly
                />
              </div>

              <div className="form-field">
                <Label htmlFor="county" className="form-label">County</Label>
                <Input
                  id="county"
                  name="county"
                  placeholder="Auto-filled from address"
                  value={formData.county}
                  className="form-input bg-muted"
                  readOnly
                />
              </div>

              <div className="md:col-span-2 form-field">
                <Label htmlFor="extra_notes" className="form-label">Any Additional Details?</Label>
                <Textarea
                  id="extra_notes"
                  name="extra_notes"
                  placeholder="Include examples like 'How'd You Find Them', 'Did you still need help closing them?' etc."
                  value={formData.extra_notes}
                  onChange={handleInputChange}
                  className="min-h-[100px]"
                />
              </div>

              <div className="md:col-span-2 form-field">
                <Label className="form-label">Upload Documents</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Drag files here or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Accepted formats: .pdf, .jpg, .png (Max file size per file)
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

                {/* Uploaded Files */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2 mt-4">
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
              </div>
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