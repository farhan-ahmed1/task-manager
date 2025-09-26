import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
// import { Separator } from '@/components/ui/separator'; // Component doesn't exist yet
import { 
  AlertCircle, 
  Loader2, 
  Mail, 
  UserPlus, 
  Crown, 
  Shield, 
  User, 
  Eye,
  Trash2,
  Copy,
  Check
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Project } from '@/types/api';

// Types for project sharing
export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  invited_by: string;
  invited_at: string;
  accepted_at?: string;
  user_email?: string;
  user_name?: string;
}

export interface ProjectInvitation {
  id: string;
  project_id: string;
  email: string;
  role: 'ADMIN' | 'MEMBER' | 'VIEWER';
  token: string;
  expires_at: string;
  invited_by: string;
  invited_by_name?: string;
  project_name?: string;
}

// Form validation schema
const inviteUserSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']),
});

type InviteUserFormData = z.infer<typeof inviteUserSchema>;

interface ProjectSharingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onInviteUser?: (email: string, role: 'ADMIN' | 'MEMBER' | 'VIEWER') => Promise<void>;
  onRemoveMember?: (userId: string) => Promise<void>;
  isInviting?: boolean;
  error?: string | null;
}

const ProjectSharingDialog: React.FC<ProjectSharingDialogProps> = ({
  isOpen,
  onClose,
  project,
  onInviteUser,
  onRemoveMember,
  isInviting = false,
  error,
}) => {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<InviteUserFormData>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: {
      role: 'MEMBER',
    },
  });

  const selectedRole = watch('role');

  const loadMembers = React.useCallback(async () => {
    setIsLoadingMembers(true);
    setMembersError(null);

    try {
      const response = await fetch(`http://localhost:3000/api/projects/${project.id}/members`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load project members');
      }

      const data = await response.json();
      setMembers(data.data || []);
    } catch (err) {
      setMembersError(err instanceof Error ? err.message : 'Failed to load members');
    } finally {
      setIsLoadingMembers(false);
    }
  }, [project.id]);

  // Load project members when dialog opens
  useEffect(() => {
    if (isOpen && project) {
      loadMembers();
    }
  }, [isOpen, project, loadMembers]);

  const onFormSubmit = async (data: InviteUserFormData) => {
    if (onInviteUser) {
      try {
        await onInviteUser(data.email, data.role);
        reset();
        await loadMembers(); // Reload members after successful invite
      } catch (err) {
        // Error is handled by parent component
        console.error('Failed to invite user:', err);
      }
    }
  };

  const handleRemoveMember = async (member: ProjectMember) => {
    if (onRemoveMember && member.role !== 'OWNER') {
      try {
        await onRemoveMember(member.user_id);
        await loadMembers(); // Reload members after removal
      } catch (err) {
        console.error('Failed to remove member:', err);
      }
    }
  };

  const copyInviteLink = async () => {
    const inviteUrl = `${window.location.origin}/projects/join/${project.id}`;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER':
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case 'ADMIN':
        return <Shield className="h-4 w-4 text-blue-600" />;
      case 'MEMBER':
        return <User className="h-4 w-4 text-green-600" />;
      case 'VIEWER':
        return <Eye className="h-4 w-4 text-gray-600" />;
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'default';
      case 'ADMIN':
        return 'secondary';
      case 'MEMBER':
        return 'outline';
      case 'VIEWER':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-white text-gray-900">
        <DialogHeader>
          <DialogTitle className="text-gray-900 flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Share Project
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Invite team members to collaborate on "{project.name}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <div className="ml-2">
                <p className="text-sm font-medium">Error</p>
                <p className="text-sm">{error}</p>
              </div>
            </Alert>
          )}

          {/* Invite Form */}
          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {/* Email Input */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email address..."
                    className={`pl-10 bg-white border-gray-300 text-gray-900 placeholder-gray-500 ${
                      errors.email ? 'border-red-500' : ''
                    }`}
                    {...register('email')}
                    disabled={isInviting}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              {/* Role Selection */}
              <div className="space-y-2">
                <Label htmlFor="role" className="text-gray-700 font-medium">
                  Role
                </Label>
                <Select
                  value={selectedRole}
                  onValueChange={(value: 'ADMIN' | 'MEMBER' | 'VIEWER') => setValue('role', value)}
                  disabled={isInviting}
                >
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VIEWER">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-gray-600" />
                        <div>
                          <div className="font-medium">Viewer</div>
                          <div className="text-xs text-gray-500">Can view project and tasks</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="MEMBER">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-green-600" />
                        <div>
                          <div className="font-medium">Member</div>
                          <div className="text-xs text-gray-500">Can create and edit tasks</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="ADMIN">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-blue-600" />
                        <div>
                          <div className="font-medium">Admin</div>
                          <div className="text-xs text-gray-500">Can manage project and members</div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Invite Button */}
            <Button
              type="submit"
              className="w-full bg-gray-900 text-white hover:bg-gray-800"
              disabled={isInviting}
            >
              {isInviting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Send Invitation
            </Button>
          </form>

          <hr className="border-gray-200" />

          {/* Quick Share Link */}
          <div className="space-y-2">
            <Label className="text-gray-700 font-medium">Quick Share</Label>
            <div className="flex gap-2">
              <Input
                value={`${window.location.origin}/projects/join/${project.id}`}
                readOnly
                className="bg-gray-50 border-gray-300 text-gray-700 text-xs"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={copyInviteLink}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                {copySuccess ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Share this link to invite members with default MEMBER role
            </p>
          </div>

          <hr className="border-gray-200" />

          {/* Current Members */}
          <div className="space-y-3">
            <Label className="text-gray-700 font-medium">Project Members</Label>
            
            {isLoadingMembers ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                <span className="ml-2 text-sm text-gray-500">Loading members...</span>
              </div>
            ) : membersError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <p className="text-sm">{membersError}</p>
              </Alert>
            ) : (
              <ScrollArea className="max-h-40">
                <div className="space-y-2">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {getRoleIcon(member.role)}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {member.user_name || member.user_email}
                            </div>
                            {member.user_name && (
                              <div className="text-xs text-gray-500">
                                {member.user_email}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getRoleBadgeVariant(member.role)}>
                          {member.role}
                        </Badge>
                        {member.role !== 'OWNER' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMember(member)}
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {members.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No members found
                    </p>
                  )}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectSharingDialog;