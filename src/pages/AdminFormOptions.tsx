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
  fetchAllFormOptions, 
  createUtility, 
  createLandType, 
  createAccessType,
  updateUtility,
  updateLandType,
  updateAccessType,
  deleteUtility,
  deleteLandType,
  deleteAccessType,
  clearError 
} from '@/store/formOptionsSlice';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Shield, 
  LogOut,
  Settings
} from 'lucide-react';

const AdminFormOptions = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const { utilities, landTypes, accessTypes, loading, error } = useAppSelector((state) => state.formOptions);
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

    dispatch(fetchAllFormOptions());
  }, [isAuthenticated, user, navigate, dispatch]);

  const getTabData = () => {
    const data = {
      landTypes: { title: 'Land Types', items: landTypes },
      utilities: { title: 'Utilities', items: utilities },
      accessTypes: { title: 'Access Types', items: accessTypes }
    };
    return data[activeTab] || { title: '', items: [] };
  };

  const addOption = async (category) => {
    if (!newOption.value.trim() || !newOption.label.trim()) {
      toast({
        title: "Error",
        description: "Please enter both value and label",
        variant: "destructive",
      });
      return;
    }

    const data = {
      value: newOption.value.trim(),
      display_name: newOption.label.trim(),
    };

    try {
      let action;
      switch (category) {
        case 'utilities':
          action = createUtility(data);
          break;
        case 'landTypes':
          action = createLandType(data);
          break;
        case 'accessTypes':
          action = createAccessType(data);
          break;
        default:
          throw new Error('Invalid category');
      }

      await dispatch(action).unwrap();
      setNewOption({ value: '', label: '' });
      toast({
        title: "Success",
        description: `${newOption.label} added successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error || "Failed to add option",
        variant: "destructive",
      });
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

  const handleAddOption = () => addOption(activeTab);

  const handleEditOption = (index) => {
    const data = getTabData();
    setEditingOption({ index, ...data.items[index] });
  };

  const handleUpdateOption = async () => {
    if (!editingOption || !editingOption.value.trim() || !editingOption.display_name?.trim()) {
      toast({
        title: "Error",
        description: "Please enter both value and display name",
        variant: "destructive",
      });
      return;
    }

    const data = {
      value: editingOption.value.trim(),
      display_name: editingOption.display_name.trim(),
    };

    try {
      let action;
      switch (activeTab) {
        case 'utilities':
          action = updateUtility({ id: editingOption.id, data });
          break;
        case 'landTypes':
          action = updateLandType({ id: editingOption.id, data });
          break;
        case 'accessTypes':
          action = updateAccessType({ id: editingOption.id, data });
          break;
        default:
          throw new Error('Invalid category');
      }

      await dispatch(action).unwrap();
      setEditingOption(null);
      toast({
        title: "Success",
        description: `${data.display_name} updated successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error || "Failed to update option",
        variant: "destructive",
      });
    }
  };

  const handleDeleteOption = async (index) => {
    const data = getTabData();
    const option = data.items[index];

    if (!option?.id) {
      toast({
        title: "Error",
        description: "Unable to delete option - missing ID",
        variant: "destructive",
      });
      return;
    }

    try {
      let action;
      switch (activeTab) {
        case 'utilities':
          action = deleteUtility(option.id);
          break;
        case 'landTypes':
          action = deleteLandType(option.id);
          break;
        case 'accessTypes':
          action = deleteAccessType(option.id);
          break;
        default:
          throw new Error('Invalid category');
      }

      await dispatch(action).unwrap();
      toast({
        title: "Success",
        description: `${option.display_name} deleted successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error || "Failed to delete option",
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
            {['landTypes', 'utilities', 'accessTypes'].map((tab) => (
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
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading options...</p>
                </div>
              ) : getTabData().items.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No options available. Add one above.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {getTabData().items.map((option, index) => (
                    <div key={option.id || index} className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                      {editingOption && editingOption.index === index ? (
                        <div className="flex items-center space-x-4 flex-1">
                          <Input
                            value={editingOption.value}
                            onChange={(e) => setEditingOption({ ...editingOption, value: e.target.value })}
                            placeholder="Value"
                            className="max-w-[200px]"
                          />
                          <Input
                            value={editingOption.display_name || editingOption.label}
                            onChange={(e) => setEditingOption({ ...editingOption, display_name: e.target.value, label: e.target.value })}
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
                            <span className="font-medium">{option.display_name}</span>
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