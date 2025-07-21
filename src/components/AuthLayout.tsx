import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building, MapPin, Users } from 'lucide-react';

const AuthLayout = ({ children, title, subtitle, type = 'user' }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Hero Section */}
        <div className="hidden lg:block space-y-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-primary rounded-xl">
                <Building className="h-8 w-8 text-primary-foreground" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">LandDeal Pro</h1>
            </div>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Professional land deal management platform for investors, agents, and developers.
            </p>
          </div>

          <div className="grid gap-6">
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-accent/10 rounded-lg">
                <MapPin className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Track Every Deal</h3>
                <p className="text-muted-foreground">Comprehensive deal tracking with location data, pricing, and development costs.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-success/10 rounded-lg">
                <Users className="h-6 w-6 text-success" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Expert Coaching</h3>
                <p className="text-muted-foreground">Get guidance from experienced coaches through our integrated messaging system.</p>
              </div>
            </div>
          </div>

          {type === 'admin' && (
            <div className="p-6 bg-primary/5 rounded-xl border border-primary/20">
              <h3 className="font-semibold text-primary mb-2">Admin Portal</h3>
              <p className="text-sm text-muted-foreground">Manage all user submissions, provide coaching, and oversee platform operations.</p>
            </div>
          )}
        </div>

        {/* Right side - Auth Form */}
        <div className="w-full max-w-md mx-auto lg:mx-0">
          <Card className="card-elevated">
            <CardHeader className="space-y-2 text-center">
              <CardTitle className="text-2xl font-bold">{title}</CardTitle>
              <CardDescription className="text-muted-foreground">{subtitle}</CardDescription>
            </CardHeader>
            <CardContent>
              {children}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;