import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { logoutUser } from '@/store/authSlice';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Shield, 
  LogOut,
  Settings
} from 'lucide-react';
import { landDealsApi, handleApiError } from '@/services/landDealsApi';

const AdminFormOptions = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [formOptions, setFormOptions] = useState({
    landTypes: [],
    utilities: [],
    accessTypes: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [editingOption, setEditingOption] = useState(null);
  const [newOption, setNewOption] = useState({ value: '', label: '' });
  const [activeTab, setActiveTab] = useState('landTypes');
  const adminEmail = user?.email || 'admin@example.com';

  useEffect(() => {
    // Check if user is authenticated and is admin
    if (!isAuthenticated) {
      navigate('/admin/login');
      return;
    }

    if (!user?.is_staff) {
      navigate('/dashboard');
      return;
    }

    loadFormOptions();
  }, [isAuthenticated, user, navigate]);

  const loadFormOptions = async () => {
    try {
      setIsLoading(true);
      const response = await landDealsApi.admin.getFormOptions();
      if (response.success) {
        setFormOptions(response.data);
      }
    } catch (error) {
      // Fallback to localStorage or default options
      const savedOptions = localStorage.getItem('formOptions');
      if (savedOptions) {
        setFormOptions(JSON.parse(savedOptions));
      } else {
        setFormOptions({
          landTypes: [
            { value: 'residential', label: 'Residential' },
            { value: 'commercial', label: 'Commercial' },
            { value: 'industrial', label: 'Industrial' },
            { value: 'agricultural', label: 'Agricultural' },
            { value: 'recreational', label: 'Recreational' },
            { value: 'mixed-use', label: 'Mixed Use' }
          ],
          utilities: [
            { value: 'electricity, water, sewer, gas', label: 'All utilities' },
            { value: 'electricity, water', label: 'Electricity & Water' },
            { value: 'electricity', label: 'Electricity only' },
            { value: 'none', label: 'No utilities' }
          ],
          accessTypes: [
            { value: 'paved-road', label: 'Paved Road' },
            { value: 'gravel-road', label: 'Gravel Road' },
            { value: 'dirt-road', label: 'Dirt Road' },
            { value: 'trail', label: 'Trail Access' },
            { value: 'none', label: 'No Direct Access' }
          ]
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      toast({
        title: "Logged out",
        description: "You have been logged out locally.",
      });
    } finally {
      navigate('/admin/login');
    }
  };

  const saveToLocalStorage = (options) => {
    localStorage.setItem('formOptions', JSON.stringify(options));
  };

  const handleAddOption = async () => {
    if (!newOption.value.trim() || !newOption.label.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both value and label fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const updatedOptions = {
        ...formOptions,
        [activeTab]: [...formOptions[activeTab], newOption]
      };
      
      setFormOptions(updatedOptions);
      saveToLocalStorage(updatedOptions);
      setNewOption({ value: '', label: '' });
      
      toast({
        title: "Option added",
        description: "New form option has been added successfully.",
      });
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast({
        title: "Failed to add option",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleEditOption = (index) => {
    setEditingOption({ index, ...formOptions[activeTab][index] });
  };

  const handleUpdateOption = async () => {
    if (!editingOption.value.trim() || !editingOption.label.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both value and label fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const updatedOptions = { ...formOptions };
      updatedOptions[activeTab][editingOption.index] = {
        value: editingOption.value,
        label: editingOption.label
      };
      
      setFormOptions(updatedOptions);
      saveToLocalStorage(updatedOptions);
      setEditingOption(null);
      
      toast({
        title: "Option updated",
        description: "Form option has been updated successfully.",
      });
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast({
        title: "Failed to update option",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleDeleteOption = async (index) => {
    try {
      const updatedOptions = { ...formOptions };
      updatedOptions[activeTab].splice(index, 1);
      
      setFormOptions(updatedOptions);
      saveToLocalStorage(updatedOptions);
      
      toast({
        title: "Option deleted",
        description: "Form option has been deleted successfully.",
      });
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast({
        title: "Failed to delete option",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const getTabDisplayName = (tab) => {
    switch (tab) {
      case 'landTypes':
        return 'Land Types';
      case 'utilities':
        return 'Utilities';
      case 'accessTypes':
        return 'Access Types';
      default:
        return tab;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary rounded-lg">
                <Settings className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Form Options Management</h1>
                <p className="text-sm text-muted-foreground">Manage submission form dropdowns</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin/dashboard')}
              >
                <Shield className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">Admin</p>
                <p className="text-xs text-muted-foreground">{adminEmail}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Tabs */}
          <div className="flex space-x-2 border-b border-border">
            {Object.keys(formOptions).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {getTabDisplayName(tab)}
              </button>
            ))}
          </div>

          {/* Add New Option */}
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle>Add New {getTabDisplayName(activeTab).slice(0, -1)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="space-y-2">
                  <Label htmlFor="new-value">Value</Label>
                  <Input
                    id="new-value"
                    placeholder="e.g., residential"
                    value={newOption.value}
                    onChange={(e) => setNewOption({ ...newOption, value: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-label">Display Label</Label>
                  <Input
                    id="new-label"
                    placeholder="e.g., Residential"
                    value={newOption.label}
                    onChange={(e) => setNewOption({ ...newOption, label: e.target.value })}
                  />
                </div>
                <Button onClick={handleAddOption} className="btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Option
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Current Options */}
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle>Current {getTabDisplayName(activeTab)}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading options...</p>
                </div>
              ) : formOptions[activeTab].length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No options available. Add one above.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formOptions[activeTab].map((option, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                      {editingOption && editingOption.index === index ? (
                        <div className="flex items-center space-x-4 flex-1">
                          <Input
                            value={editingOption.value}
                            onChange={(e) => setEditingOption({ ...editingOption, value: e.target.value })}
                            placeholder="Value"
                            className="max-w-[200px]"
                          />
                          <Input
                            value={editingOption.label}
                            onChange={(e) => setEditingOption({ ...editingOption, label: e.target.value })}
                            placeholder="Label"
                            className="max-w-[200px]"
                          />
                          <div className="flex space-x-2">
                            <Button size="sm" onClick={handleUpdateOption}>
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingOption(null)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center space-x-4">
                            <Badge variant="outline" className="font-mono text-xs">
                              {option.value}
                            </Badge>
                            <span className="font-medium">{option.label}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditOption(index)}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteOption(index)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminFormOptions;