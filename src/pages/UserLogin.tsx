import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import AuthLayout from '@/components/AuthLayout';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { requestLoginOTP, verifyLoginOTP, clearError } from '@/store/authSlice';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const UserLogin = () => {
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [otp, setOtp] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    phone: ''
  });

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isLoading, error, isAuthenticated, user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.is_staff) {
        // If user is an admin, redirect to admin dashboard
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (error) {
      toast({
        title: "Login Error",
        description: error,
        variant: "destructive",
      });
      dispatch(clearError());
    }
  }, [error, toast, dispatch]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    
    if (!formData.email || !formData.phone) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      await dispatch(requestLoginOTP(formData)).unwrap();
      toast({
        title: "OTP Sent",
        description: "Please check your email or phone for the OTP code.",
      });
      setStep('otp');
    } catch {
      // Error toast handled by error effect
    }
  };

  const handleVerifyOTP = async (e: any) => {
    e.preventDefault();

    if (otp.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter a valid 6-digit OTP",
        variant: "destructive",
      });
      return;
    }

    try {
      await dispatch(verifyLoginOTP({
        email: formData.email,
        otp
      })).unwrap();
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
      // Navigation handled by useEffect
    } catch {
      // Error toast handled by error effect
    }
  };

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <AuthLayout title="Welcome Back" subtitle="Sign in to your account">
      {step === 'credentials' ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleInputChange}
              required
              className="w-full"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? 'Sending OTP...' : 'Continue'}
          </Button>
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary hover:underline">
                Sign up here
              </Link>
            </p>
          </div>
        </form>
      ) : (
        <form onSubmit={handleVerifyOTP} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otp">Enter OTP</Label>
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={(value) => setOtp(value)}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? 'Verifying...' : 'Verify OTP'}
          </Button>

          <div className="text-center">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep('credentials')}
              className="text-sm"
            >
              Back to login
            </Button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
};

export default UserLogin;