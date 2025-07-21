import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/DashboardLayout';
import { Upload, X, FileText, Image, Video } from 'lucide-react';

const SubmitDeal = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [formData, setFormData] = useState({
    lotAddress: '',
    landType: '',
    lotSize: '',
    zoningClassification: '',
    askingPrice: '',
    estimatedAEV: '',
    developmentCosts: '',
    utilitiesAvailable: '',
    accessType: '',
    topography: '',
    environmentalFactors: '',
    nearestAttraction: '',
    landDescription: ''
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSelectChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    const newFiles = files.map((file) => ({
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

    // Simulate form submission
    setTimeout(() => {
      const dealId = `DEAL-${String(Date.now()).slice(-6)}`;
      const newDeal = {
        id: dealId,
        ...formData,
        submittedOn: new Date().toISOString().split('T')[0],
        status: 'Pending',
        coach: 'Assigned Soon',
        askingPrice: parseFloat(formData.askingPrice) || 0,
        files: uploadedFiles
      };

      // Save to localStorage
      const existingDeals = JSON.parse(localStorage.getItem('userDeals') || '[]');
      existingDeals.push(newDeal);
      localStorage.setItem('userDeals', JSON.stringify(existingDeals));

      toast({
        title: "Deal submitted successfully!",
        description: `Your deal ${dealId} has been submitted for review.`,
      });

      navigate('/dashboard');
      setIsLoading(false);
    }, 1500);
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
                <Label htmlFor="lotAddress" className="form-label">Lot Address / Location *</Label>
                <Input
                  id="lotAddress"
                  name="lotAddress"
                  placeholder="123 Main St, City, State, ZIP"
                  value={formData.lotAddress}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-field">
                <Label htmlFor="landType" className="form-label">Land Type *</Label>
                <Select value={formData.landType} onValueChange={(value) => handleSelectChange('landType', value)}>
                  <SelectTrigger className="form-input">
                    <SelectValue placeholder="Select land type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="industrial">Industrial</SelectItem>
                    <SelectItem value="agricultural">Agricultural</SelectItem>
                    <SelectItem value="recreational">Recreational</SelectItem>
                    <SelectItem value="mixed-use">Mixed Use</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="form-field">
                <Label htmlFor="lotSize" className="form-label">Lot Size *</Label>
                <Input
                  id="lotSize"
                  name="lotSize"
                  placeholder="e.g., 2.5 acres or 5000 sq ft"
                  value={formData.lotSize}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-field">
                <Label htmlFor="zoningClassification" className="form-label">Zoning Classification</Label>
                <Input
                  id="zoningClassification"
                  name="zoningClassification"
                  placeholder="e.g., R-1, C-2, M-1"
                  value={formData.zoningClassification}
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
                <Label htmlFor="askingPrice" className="form-label">Asking/Purchase Price ($) *</Label>
                <Input
                  id="askingPrice"
                  name="askingPrice"
                  type="number"
                  placeholder="125000"
                  value={formData.askingPrice}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-field">
                <Label htmlFor="estimatedAEV" className="form-label">Estimated AEV / ADV ($)</Label>
                <Input
                  id="estimatedAEV"
                  name="estimatedAEV"
                  type="number"
                  placeholder="150000"
                  value={formData.estimatedAEV}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>

              <div className="form-field">
                <Label htmlFor="developmentCosts" className="form-label">Est. Development/Holding Costs ($)</Label>
                <Input
                  id="developmentCosts"
                  name="developmentCosts"
                  type="number"
                  placeholder="25000"
                  value={formData.developmentCosts}
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
                <Label htmlFor="utilitiesAvailable" className="form-label">Utilities Available? *</Label>
                <Select value={formData.utilitiesAvailable} onValueChange={(value) => handleSelectChange('utilitiesAvailable', value)}>
                  <SelectTrigger className="form-input">
                    <SelectValue placeholder="Select utilities status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes - All utilities</SelectItem>
                    <SelectItem value="partial">Partial utilities</SelectItem>
                    <SelectItem value="no">No utilities</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="form-field">
                <Label htmlFor="accessType" className="form-label">Access Type *</Label>
                <Select value={formData.accessType} onValueChange={(value) => handleSelectChange('accessType', value)}>
                  <SelectTrigger className="form-input">
                    <SelectValue placeholder="Select access type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paved-road">Paved Road</SelectItem>
                    <SelectItem value="gravel-road">Gravel Road</SelectItem>
                    <SelectItem value="dirt-road">Dirt Road</SelectItem>
                    <SelectItem value="trail">Trail Access</SelectItem>
                    <SelectItem value="none">No Direct Access</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2 form-field">
                <Label htmlFor="nearestAttraction" className="form-label">Nearest Major City/Development/Attraction</Label>
                <Input
                  id="nearestAttraction"
                  name="nearestAttraction"
                  placeholder="e.g., 15 miles from Denver downtown"
                  value={formData.nearestAttraction}
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
                <Label htmlFor="environmentalFactors" className="form-label">Environmental Factors</Label>
                <Textarea
                  id="environmentalFactors"
                  name="environmentalFactors"
                  placeholder="Any environmental concerns, wetlands, flood zones, etc."
                  value={formData.environmentalFactors}
                  onChange={handleInputChange}
                  className="min-h-[100px]"
                />
              </div>

              <div className="md:col-span-2 form-field">
                <Label htmlFor="landDescription" className="form-label">Land Description</Label>
                <Textarea
                  id="landDescription"
                  name="landDescription"
                  placeholder="Provide a detailed description of the property..."
                  value={formData.landDescription}
                  onChange={handleInputChange}
                  className="min-h-[120px]"
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