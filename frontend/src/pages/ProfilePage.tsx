import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { User, Mail, Lock, Save, AlertCircle, CheckCircle, Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/auth';
import { ProfileUpdateSchema, PasswordChangeSchema, type ProfileUpdateFormData, type PasswordChangeFormData } from '@/validation/auth';

const ProfilePage: React.FC = () => {
  const { user, token, logout, updateUser } = useAuth();
  
  // Profile update state
  const [profileData, setProfileData] = useState<ProfileUpdateFormData>({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [profileErrors, setProfileErrors] = useState<Partial<ProfileUpdateFormData>>({});
  const [profileGeneralError, setProfileGeneralError] = useState<string>('');
  const [profileSuccessMessage, setProfileSuccessMessage] = useState<string>('');
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  // Password change state
  const [passwordData, setPasswordData] = useState<PasswordChangeFormData>({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState<Partial<PasswordChangeFormData>>({});
  const [passwordGeneralError, setPasswordGeneralError] = useState<string>('');
  const [passwordSuccessMessage, setPasswordSuccessMessage] = useState<string>('');
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  // Profile update handlers
  const handleProfileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData((prev: ProfileUpdateFormData) => ({
      ...prev,
      [name]: value,
    }));
    // Clear field-specific error when user starts typing
    if (profileErrors[name as keyof ProfileUpdateFormData]) {
      setProfileErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
    // Clear general error and success message
    if (profileGeneralError) setProfileGeneralError('');
    if (profileSuccessMessage) setProfileSuccessMessage('');
  };

  const validateProfileForm = (): boolean => {
    try {
      ProfileUpdateSchema.parse(profileData);
      setProfileErrors({});
      return true;
    } catch (error) {
      if (error && typeof error === 'object' && 'issues' in error) {
        const zodError = error as { issues: Array<{ path: string[]; message: string }> };
        const fieldErrors: Partial<ProfileUpdateFormData> = {};
        zodError.issues.forEach((issue) => {
          const field = issue.path[0] as keyof ProfileUpdateFormData;
          fieldErrors[field] = issue.message;
        });
        setProfileErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    if (!validateProfileForm()) {
      return;
    }

    setIsProfileLoading(true);
    setProfileGeneralError('');
    setProfileSuccessMessage('');

    try {
      if (!token) {
        throw new Error('No authentication token available');
      }

      const updatedUser = await authService.updateProfile(profileData, token);
      console.log('Profile updated:', updatedUser);
      
      // Update the user context with new data
      updateUser(updatedUser);
      
      setProfileSuccessMessage('Profile updated successfully!');
    } catch (err) {
      setProfileGeneralError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsProfileLoading(false);
    }
  };

  // Password change handlers
  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev: PasswordChangeFormData) => ({
      ...prev,
      [name]: value,
    }));
    // Clear field-specific error when user starts typing
    if (passwordErrors[name as keyof PasswordChangeFormData]) {
      setPasswordErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
    // Clear general error and success message
    if (passwordGeneralError) setPasswordGeneralError('');
    if (passwordSuccessMessage) setPasswordSuccessMessage('');
  };

  const validatePasswordForm = (): boolean => {
    try {
      PasswordChangeSchema.parse(passwordData);
      console.log('✅ Password validation successful');
      setPasswordErrors({});
      return true;
    } catch (error) {
      console.log('❌ Password validation failed:', error);
      if (error && typeof error === 'object' && 'issues' in error) {
        const zodError = error as { issues: Array<{ path: string[]; message: string }> };
        const fieldErrors: Partial<PasswordChangeFormData> = {};
        zodError.issues.forEach((issue) => {
          const field = issue.path[0] as keyof PasswordChangeFormData;
          fieldErrors[field] = issue.message;
          console.log(`❌ Field error - ${field}: ${issue.message}`);
        });
        setPasswordErrors(fieldErrors);
      }
      return false;
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    if (!validatePasswordForm()) {
      return;
    }

    setIsPasswordLoading(true);
    setPasswordGeneralError('');
    setPasswordSuccessMessage('');

    try {
      if (!token) {
        throw new Error('No authentication token available');
      }

      const passwordChangeData = {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      };

      await authService.changePassword(passwordChangeData, token);
      
      setPasswordSuccessMessage('Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
    } catch (err) {
      setPasswordGeneralError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
          Account Settings
        </h1>
        <p className="text-lg text-muted-foreground">
          Manage your account information and security settings
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2">
        {/* Profile Information Card */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Update your personal information and account details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              {profileGeneralError && (
                <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  <AlertCircle className="w-4 h-4" />
                  {profileGeneralError}
                </div>
              )}
              
              {profileSuccessMessage && (
                <div className="flex items-center gap-2 p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
                  <CheckCircle className="w-4 h-4" />
                  {profileSuccessMessage}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="profile-name" className="flex items-center gap-2 text-sm font-medium">
                  <User className="w-4 h-4 text-primary" />
                  Full Name
                </Label>
                <Input
                  id="profile-name"
                  name="name"
                  type="text"
                  placeholder="Enter your full name"
                  className={`h-11 ${profileErrors.name ? 'border-red-500 focus:border-red-500' : ''}`}
                  value={profileData.name}
                  onChange={handleProfileInputChange}
                  required
                />
                {profileErrors.name && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {profileErrors.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-email" className="flex items-center gap-2 text-sm font-medium">
                  <Mail className="w-4 h-4 text-primary" />
                  Email Address
                </Label>
                <Input
                  id="profile-email"
                  name="email"
                  type="email"
                  placeholder="Enter your email address"
                  className={`h-11 ${profileErrors.email ? 'border-red-500 focus:border-red-500' : ''}`}
                  value={profileData.email}
                  onChange={handleProfileInputChange}
                  required
                />
                {profileErrors.email && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {profileErrors.email}
                  </p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 font-medium"
                disabled={isProfileLoading}
              >
                {isProfileLoading ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Update Profile
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Password Change Card */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Change Password
            </CardTitle>
            <CardDescription>
              Update your password to keep your account secure
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {passwordGeneralError && (
                <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  <AlertCircle className="w-4 h-4" />
                  {passwordGeneralError}
                </div>
              )}
              
              {passwordSuccessMessage && (
                <div className="flex items-center gap-2 p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
                  <CheckCircle className="w-4 h-4" />
                  {passwordSuccessMessage}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="current-password" className="flex items-center gap-2 text-sm font-medium">
                  <Lock className="w-4 h-4 text-primary" />
                  Current Password
                </Label>
                <Input
                  id="current-password"
                  name="currentPassword"
                  type="password"
                  placeholder="Enter your current password"
                  className={`h-11 ${passwordErrors.currentPassword ? 'border-red-500 focus:border-red-500' : ''}`}
                  value={passwordData.currentPassword}
                  onChange={handlePasswordInputChange}
                  required
                />
                {passwordErrors.currentPassword && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {passwordErrors.currentPassword}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password" className="flex items-center gap-2 text-sm font-medium">
                  <Lock className="w-4 h-4 text-primary" />
                  New Password
                </Label>
                <Input
                  id="new-password"
                  name="newPassword"
                  type="password"
                  placeholder="Enter your new password"
                  className={`h-11 ${passwordErrors.newPassword ? 'border-red-500 focus:border-red-500' : ''}`}
                  value={passwordData.newPassword}
                  onChange={handlePasswordInputChange}
                  required
                />
                {passwordErrors.newPassword && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {passwordErrors.newPassword}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-new-password" className="flex items-center gap-2 text-sm font-medium">
                  <Lock className="w-4 h-4 text-primary" />
                  Confirm New Password
                </Label>
                <Input
                  id="confirm-new-password"
                  name="confirmNewPassword"
                  type="password"
                  placeholder="Confirm your new password"
                  className={`h-11 ${passwordErrors.confirmNewPassword ? 'border-red-500 focus:border-red-500' : ''}`}
                  value={passwordData.confirmNewPassword}
                  onChange={handlePasswordInputChange}
                  required
                />
                {passwordErrors.confirmNewPassword && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {passwordErrors.confirmNewPassword}
                  </p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 font-medium"
                disabled={isPasswordLoading}
              >
                {isPasswordLoading ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Changing...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Change Password
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Account Actions */}
      <Card className="card-hover mt-8">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
          <CardDescription>
            Actions that cannot be undone
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              variant="outline" 
              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
              onClick={handleLogout}
            >
              Sign Out of Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;