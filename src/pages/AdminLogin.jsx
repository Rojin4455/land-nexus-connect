import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import AuthLayout from '@/components/AuthLayout';
import { Eye, EyeOff, Shield } from 'lucide-react';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate authentication
    setTimeout(() => {
      localStorage.setItem('adminToken', 'demo-admin-token');
      localStorage.setItem('adminEmail', formData.email);
      toast({
        title: "Admin access granted",
        description: "Welcome to the admin dashboard.",
      });
      navigate('/admin/dashboard');
      setIsLoading(false);
    }, 1000);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <AuthLayout 
      title="Admin Portal" 
      subtitle="Secure access for platform administrators"
      type="admin"
    >
      <div className="flex items-center justify-center mb-6">
        <div className="p-3 bg-primary/10 rounded-full">
          <Shield className="h-8 w-8 text-primary" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-field">
          <Label htmlFor="email" className="form-label">Admin Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="admin@example.com"
            value={formData.email}
            onChange={handleInputChange}
            className="form-input"
            required
          />
        </div>

        <div className="form-field">
          <Label htmlFor="password" className="form-label">Admin Password</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter admin password"
              value={formData.password}
              onChange={handleInputChange}
              className="form-input pr-10"
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full btn-primary" 
          disabled={isLoading}
        >
          {isLoading ? "Authenticating..." : "Access Admin Portal"}
        </Button>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Not an admin?{' '}
            <Button 
              variant="link" 
              className="p-0 text-primary hover:text-primary-dark"
              onClick={() => navigate('/login')}
            >
              User Login
            </Button>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
};

export default AdminLogin;