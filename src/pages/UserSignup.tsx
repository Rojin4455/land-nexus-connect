import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import AuthLayout from '@/components/AuthLayout';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { requestSignupOTP, verifySignupOTP, clearError } from '@/store/authSlice';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const UserSignup = () => {
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [otp, setOtp] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    phone: ''
  });

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isLoading, error } = useAppSelector((state) => state.auth);


  useEffect(() => {
    if (error) {
      toast({
        title: "Registration Error",
        description: error,
        variant: "destructive",
      });
      dispatch(clearError());
    }
  }, [error, toast, dispatch]);

  const handleSubmitDetails = async (e: any) => {
    e.preventDefault();

    if (!formData.username || !formData.email || !formData.phone) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      await dispatch(requestSignupOTP(formData)).unwrap();
      toast({
        title: "OTP Sent",
        description: "Please check your email/phone for the verification code.",
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
      await dispatch(verifySignupOTP({ 
        username: formData.username, 
        otp 
      })).unwrap();
      toast({
        title: "Signup Successful",
        description: "Your account has been created successfully.",
      });
      navigate('/dashboard');
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

  if (step === 'otp') {
    return (
      <AuthLayout title="Verify OTP" subtitle="Enter the verification code sent to your email/phone">
        <form onSubmit={handleVerifyOTP} className="space-y-6">
          <div className="space-y-4">
            <div className="flex flex-col items-center space-y-2">
              <Label htmlFor="otp">Enter 6-digit OTP</Label>
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
            disabled={isLoading || otp.length !== 6}
          >
            {isLoading ? "Verifying..." : "Verify & Complete Signup"}
          </Button>

          <div className="text-center">
            <Button
              type="button"
              variant="link"
              onClick={() => setStep('details')}
              className="text-sm"
            >
              Back to signup form
            </Button>
          </div>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create Account" subtitle="Join our platform and start managing your land deals today">
      <form onSubmit={handleSubmitDetails} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Username *</Label>
          <Input
            id="username"
            name="username"
            type="text"
            value={formData.username}
            onChange={handleInputChange}
            required
            className="w-full"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first_name">First Name</Label>
            <Input
              id="first_name"
              name="first_name"
              type="text"
              value={formData.first_name}
              onChange={handleInputChange}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_name">Last Name</Label>
            <Input
              id="last_name"
              name="last_name"
              type="text"
              value={formData.last_name}
              onChange={handleInputChange}
              className="w-full"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address *</Label>
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
          <Label htmlFor="phone">Phone Number *</Label>
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
          {isLoading ? "Sending OTP..." : "Continue"}
        </Button>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline">
              Sign in here
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
};

export default UserSignup;