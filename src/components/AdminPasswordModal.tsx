
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Eye, EyeOff } from "lucide-react";
import { useUserRole } from "./UserRoleProvider";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AdminPasswordModal = ({ open, onOpenChange }: Props) => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { switchToAdmin } = useUserRole();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = switchToAdmin(password);
    
    if (success) {
      setPassword("");
      setError("");
      onOpenChange(false);
    } else {
      setError("Invalid password. Please try again.");
    }
  };

  const handleClose = () => {
    setPassword("");
    setError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Admin Access Required
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Enter admin password:</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="pr-10"
                autoFocus
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </div>
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
            >
              Access Admin
            </Button>
          </div>
        </form>

        <div className="text-xs text-gray-500 mt-4 p-3 bg-gray-50 rounded">
          <strong>Demo Password:</strong> admin123
        </div>
      </DialogContent>
    </Dialog>
  );
};
