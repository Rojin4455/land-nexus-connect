import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import AuthLayout from '@/components/AuthLayout';
import { Eye, EyeOff } from 'lucide-react';

const UserLogin = () => {
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
      localStorage.setItem('userToken', 'demo-user-token');
      localStorage.setItem('userEmail', formData.email);
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
      navigate('/dashboard');
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
      title="Welcome Back" 
      subtitle="Sign in to your account to manage your land deals"
      type="user"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-field">
          <Label htmlFor="email" className="form-label">Email Address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleInputChange}
            className="form-input"
            required
          />
        </div>

        <div className="form-field">
          <Label htmlFor="password" className="form-label">Password</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
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
          {isLoading ? "Signing in..." : "Sign In"}
        </Button>

        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Button 
              variant="link" 
              className="p-0 text-primary hover:text-primary-dark"
              onClick={() => navigate('/signup')}
            >
              Create one here
            </Button>
          </p>
          <p className="text-sm text-muted-foreground">
            Are you an admin?{' '}
            <Button 
              variant="link" 
              className="p-0 text-accent hover:text-accent/80"
              onClick={() => navigate('/admin/login')}
            >
              Admin Login
            </Button>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
};

export default UserLogin;