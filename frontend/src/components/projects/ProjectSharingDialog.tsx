import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ButtonSpinner, Spinner } from '@/components/ui/spinner';
// import { Separator } from '@/components/ui/separator'; // Component doesn't exist yet
import { 
  AlertCircle, 
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
      }
    }
  };

  const handleRemoveMember = async (member: ProjectMember) => {
    if (onRemoveMember && member.role !== 'OWNER') {
      try {
        await onRemoveMember(member.user_id);
        await loadMembers(); // Reload members after removal
      } catch (err) {
        // Error is handled by parent component
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
      // Silently fail if clipboard access is denied
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER':
        return <Crown className="h-4 w-4 text-warning" />;
      case 'ADMIN':
        return <Shield className="h-4 w-4 text-info" />;
      case 'MEMBER':
        return <User className="h-4 w-4 text-success" />;
      case 'VIEWER':
        return <Eye className="h-4 w-4 text-muted-foreground" />;
      default:
        return <User className="h-4 w-4 text-muted-foreground" />;
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
      <DialogContent className="sm:max-w-lg bg-white text-[var(--text-primary)]">
        <DialogHeader>
          <DialogTitle className="text-[var(--text-primary)] flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Share Project
          </DialogTitle>
          <DialogDescription className="text-[var(--text-secondary)]">
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
                <Label htmlFor="email" className="text-[var(--text-secondary)] font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email address..."
                    className={`pl-10 bg-white border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] ${
                      errors.email ? 'border-red-500' : ''
                    }`}
                    {...register('email')}
                    disabled={isInviting}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-error">{errors.email.message}</p>
                )}
              </div>

              {/* Role Selection */}
              <div className="space-y-2">
                <Label htmlFor="role" className="text-[var(--text-secondary)] font-medium">
                  Role
                </Label>
                <Select
                  value={selectedRole}
                  onValueChange={(value: 'ADMIN' | 'MEMBER' | 'VIEWER') => setValue('role', value)}
                  disabled={isInviting}
                >
                  <SelectTrigger className="bg-white border-[var(--border)] text-[var(--text-primary)]">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VIEWER">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-[var(--text-secondary)]" />
                        <div>
                          <div className="font-medium">Viewer</div>
                          <div className="text-xs text-[var(--text-secondary)]">Can view project and tasks</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="MEMBER">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-success" />
                        <div>
                          <div className="font-medium">Member</div>
                          <div className="text-xs text-[var(--text-secondary)]">Can create and edit tasks</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="ADMIN">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-info" />
                        <div>
                          <div className="font-medium">Admin</div>
                          <div className="text-xs text-[var(--text-secondary)]">Can manage project and members</div>
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
              className="w-full bg-[var(--text-primary)] text-white hover:bg-[var(--text-primary)]/90"
              disabled={isInviting}
            >
              {isInviting && <ButtonSpinner />}
              Send Invitation
            </Button>
          </form>

          <hr className="border-[var(--border)]" />

          {/* Quick Share Link */}
          <div className="space-y-2">
            <Label className="text-[var(--text-secondary)] font-medium">Quick Share</Label>
            <div className="flex gap-2">
              <Input
                value={`${window.location.origin}/projects/join/${project.id}`}
                readOnly
                className="bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-secondary)] text-xs"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={copyInviteLink}
                className="border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
              >
                {copySuccess ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Share this link to invite members with default MEMBER role
            </p>
          </div>

          <hr className="border-[var(--border)]" />

          {/* Current Members */}
          <div className="space-y-3">
            <Label className="text-[var(--text-secondary)] font-medium">Project Members</Label>
            
            {isLoadingMembers ? (
              <div className="flex items-center justify-center py-4">
                <Spinner size="sm" text="Loading members..." />
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
                      className="flex items-center justify-between p-2 bg-[var(--bg-secondary)] rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {getRoleIcon(member.role)}
                          <div>
                            <div className="text-sm font-medium text-[var(--text-primary)]">
                              {member.user_name || member.user_email}
                            </div>
                            {member.user_name && (
                              <div className="text-xs text-[var(--text-secondary)]">
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
                            className="h-6 w-6 p-0 text-error hover:text-error hover:bg-error-light"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {members.length === 0 && (
                    <p className="text-sm text-[var(--text-secondary)] text-center py-4">
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