import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
    landType: '',
    acreage: '',
    zoning: '',
    askingPrice: '',
    estimatedAEV: '',
    developmentCosts: '',
    utilities: '',
    accessType: '',
    topography: '',
    environmentalFactors: '',
    nearestAttraction: '',
    description: ''
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
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
        landType: formData.landType,
        acreage: parseFloat(formData.acreage) || 0,
        zoning: formData.zoning,
        askingPrice: parseFloat(formData.askingPrice) || 0,
        estimatedAEV: formData.estimatedAEV,
        developmentCosts: formData.developmentCosts,
        utilities: formData.utilities,
        accessType: formData.accessType,
        topography: formData.topography,
        environmentalFactors: formData.environmentalFactors,
        nearestAttraction: formData.nearestAttraction,
        description: formData.description,
        files: uploadedFiles.map(f => f.file)
      };

      const photos = uploadedFiles.filter(file => file.type.startsWith('image/')).map(file => file.file);
      const documents = uploadedFiles.filter(file => !file.type.startsWith('image/')).map(file => file.file);

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
        landType: '',
        acreage: '',
        zoning: '',
        askingPrice: '',
        estimatedAEV: '',
        developmentCosts: '',
        utilities: '',
        accessType: '',
        topography: '',
        environmentalFactors: '',
        nearestAttraction: '',
        description: ''
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit New Deal</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="landType">Land Type</Label>
                  <Select value={formData.landType} onValueChange={(value) => handleSelectChange('landType', value)}>
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
                  <Label htmlFor="askingPrice">Asking Price ($)</Label>
                  <Input
                    id="askingPrice"
                    name="askingPrice"
                    type="number"
                    step="0.01"
                    placeholder="Enter asking price"
                    value={formData.askingPrice}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimatedAEV">Estimated AEV ($)</Label>
                  <Input
                    id="estimatedAEV"
                    name="estimatedAEV"
                    type="number"
                    step="0.01"
                    placeholder="Enter estimated AEV"
                    value={formData.estimatedAEV}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="developmentCosts">Development Costs ($)</Label>
                  <Input
                    id="developmentCosts"
                    name="developmentCosts"
                    type="number"
                    step="0.01"
                    placeholder="Enter development costs"
                    value={formData.developmentCosts}
                    onChange={handleInputChange}
                  />
                </div>
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
                  <Label htmlFor="accessType">Access Type</Label>
                  <Select value={formData.accessType} onValueChange={(value) => handleSelectChange('accessType', value)}>
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
                  <Label htmlFor="environmentalFactors">Environmental Factors</Label>
                  <Input
                    id="environmentalFactors"
                    name="environmentalFactors"
                    placeholder="Environmental considerations"
                    value={formData.environmentalFactors}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nearestAttraction">Nearest Attraction</Label>
                <Input
                  id="nearestAttraction"
                  name="nearestAttraction"
                  placeholder="Describe nearest attraction"
                  value={formData.nearestAttraction}
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

          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Files</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
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
                    <div key={file.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getFileIcon(file.type)}
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
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