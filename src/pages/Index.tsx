import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { MapPin, Users, TrendingUp, Shield, ArrowRight, CheckCircle } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-background via-secondary/20 to-accent/10 min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-primary rounded-xl">
                    <MapPin className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <h1 className="text-4xl lg:text-5xl font-bold text-foreground">
                    LandDeal Pro
                  </h1>
                </div>
                <p className="text-xl lg:text-2xl text-muted-foreground leading-relaxed">
                  Professional land deal management platform for investors, agents, and developers.
                </p>
                <p className="text-lg text-muted-foreground">
                  Submit deals, get expert coaching, and track your investments all in one place.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  className="btn-hero text-lg px-8 py-6"
                  onClick={() => navigate('/signup')}
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  variant="outline" 
                  className="text-lg px-8 py-6"
                  onClick={() => navigate('/login')}
                >
                  Sign In
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">500+</div>
                  <div className="text-sm text-muted-foreground">Deals Analyzed</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">95%</div>
                  <div className="text-sm text-muted-foreground">Success Rate</div>
                </div>
              </div>
            </div>

            {/* Right side - Features */}
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-foreground">Why Choose LandDeal Pro?</h3>
                
                <div className="space-y-4">
                  <div className="flex items-start space-x-4 p-4 bg-card rounded-lg border border-border">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">Professional Analysis</h4>
                      <p className="text-muted-foreground">Get detailed evaluations from experienced land investment coaches.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4 p-4 bg-card rounded-lg border border-border">
                    <div className="p-2 bg-accent/10 rounded-lg">
                      <Users className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">Expert Coaching</h4>
                      <p className="text-muted-foreground">Direct communication with coaches through our integrated messaging system.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4 p-4 bg-card rounded-lg border border-border">
                    <div className="p-2 bg-success/10 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-success" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">Complete Tracking</h4>
                      <p className="text-muted-foreground">Monitor all your deals with detailed status updates and documentation.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-primary/5 rounded-xl p-6 border border-primary/20">
                <div className="flex items-center space-x-3 mb-3">
                  <Shield className="h-6 w-6 text-primary" />
                  <h4 className="font-semibold text-primary">Admin Portal Available</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Coaches and administrators can manage all submissions and provide expert guidance through our dedicated admin portal.
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/admin/login')}
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  Admin Access
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              From deal submission to expert analysis, we provide all the tools you need for successful land investments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <MapPin className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Submit Deals</h3>
              <p className="text-muted-foreground">
                Comprehensive forms to capture all essential property information, financials, and documentation.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                <Users className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Get Coaching</h3>
              <p className="text-muted-foreground">
                Receive personalized feedback and guidance from experienced land investment professionals.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
                <TrendingUp className="h-8 w-8 text-success" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Track Progress</h3>
              <p className="text-muted-foreground">
                Monitor all your deals with real-time status updates and comprehensive dashboard analytics.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-primary to-accent">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-primary-foreground mb-6">
            Ready to Transform Your Land Investments?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8">
            Join hundreds of successful investors who trust LandDeal Pro for their land investment decisions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6"
              onClick={() => navigate('/signup')}
            >
              Start Your Free Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              className="border-white text-white hover:bg-white hover:text-primary text-lg px-8 py-6"
              onClick={() => navigate('/login')}
            >
              Sign In
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
