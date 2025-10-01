import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { User } from 'lucide-react';

interface UserDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any | null;
}

const UserDetailsDialog = ({ open, onOpenChange, user }: UserDetailsDialogProps) => {
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            JV Partner Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">User ID</Label>
              <p className="font-mono text-sm font-medium text-primary mt-1">{user.id}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Username</Label>
              <p className="font-medium mt-1">{user.username || 'N/A'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">First Name</Label>
              <p className="font-medium mt-1">{user.first_name || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Last Name</Label>
              <p className="font-medium mt-1">{user.last_name || 'N/A'}</p>
            </div>
          </div>

          <div>
            <Label className="text-muted-foreground">Email</Label>
            <p className="font-medium mt-1">{user.email || 'N/A'}</p>
          </div>

          <div>
            <Label className="text-muted-foreground">LLC Name</Label>
            <p className="font-medium mt-1">{user.llc_name || 'N/A'}</p>
          </div>

          <div>
            <Label className="text-muted-foreground">Phone</Label>
            <p className="font-medium mt-1">{user.phone || 'N/A'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailsDialog;
