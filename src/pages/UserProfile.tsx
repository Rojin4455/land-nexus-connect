import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Loader2, User, Mail, Phone, Building2 } from 'lucide-react';
import { profileApi, UserProfile as UserProfileType } from '@/services/profileApi';
import { useAppSelector } from '@/hooks/useAppSelector';

const UserProfile = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const isStaff = user?.is_staff || false;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileExists, setProfileExists] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    llc_name: '',
    phone: '',
  });
  const [profileData, setProfileData] = useState<UserProfileType | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (isStaff) {
      navigate('/admin/dashboard');
      return;
    }

    loadProfile();
  }, [isAuthenticated, isStaff, navigate]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const profile = await profileApi.getProfile();
      setProfileData(profile);
      setProfileExists(true);
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        email: profile.email || '',
        llc_name: profile.llc_name || '',
        phone: profile.phone || '',
      });
    } catch (error: any) {
      if (error.response?.status === 404 || error.response?.data?.detail?.includes('does not exist')) {
        setProfileExists(false);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load profile',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.first_name || !formData.last_name || !formData.email) {
      toast({
        title: 'Validation Error',
        description: 'First name, last name, and email are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      
      if (profileExists) {
        // Update existing profile
        const updated = await profileApi.updateProfile(formData);
        setProfileData(updated);
        toast({
          title: 'Success',
          description: 'Profile updated successfully',
        });
      } else {
        // Create new profile
        const created = await profileApi.createProfile(formData);
        setProfileData(created);
        setProfileExists(true);
        toast({
          title: 'Success',
          description: 'Profile created successfully',
        });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 
                          (profileExists ? 'Failed to update profile' : 'Failed to create profile');
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout activeTab="profile">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeTab="profile">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {profileExists ? 'Edit Profile' : 'Create Profile'}
            </CardTitle>
            <CardDescription>
              {profileExists 
                ? 'Update your personal information and contact details' 
                : 'Complete your profile to get started'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {profileData && (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <Label className="text-sm text-muted-foreground">Username (Read-only)</Label>
                  <p className="font-medium">{profileData.username}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">
                    First Name <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      placeholder="John"
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name">
                    Last Name <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      placeholder="Doe"
                      className="pl-9"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="john@example.com"
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="llc_name">LLC Name</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="llc_name"
                    name="llc_name"
                    value={formData.llc_name}
                    onChange={handleInputChange}
                    placeholder="Doe Holdings LLC"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+1 555 123 4567"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {profileExists ? 'Update Profile' : 'Create Profile'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default UserProfile;
