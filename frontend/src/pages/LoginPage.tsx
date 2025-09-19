import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Mail, Lock, LogIn } from 'lucide-react';

const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background bg-gradient-pattern py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-8">
        <div className="text-center">
          <h2 className="text-4xl font-bold tracking-tight text-foreground mb-2">
            Welcome Back
          </h2>
          <p className="text-lg text-muted-foreground">
            Sign in to your Task Manager account
          </p>
        </div>
        
        <Card className="card-hover auth-form-container shadow-xl p-2">
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Enter your email and password to access your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-8">
            <div className="space-y-3">
              <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
                <Mail className="w-4 h-4 text-primary" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                className="h-12 text-base"
                required
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="password" className="flex items-center gap-2 text-sm font-medium">
                <Lock className="w-4 h-4 text-primary" />
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                className="h-12 text-base"
                required
              />
            </div>
            <div className="space-y-4">
              <Button type="submit" className="w-full h-12 text-base font-medium">
                <LogIn className="w-5 h-5 mr-2" />
                Sign In
              </Button>
              <div className="text-center">
                <a href="/register" className="text-sm text-primary hover:underline font-medium">
                  Don't have an account? Create one here
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;