import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ForgotPasswordDialog = ({ open, onOpenChange }: ForgotPasswordDialogProps) => {
  const [memberNumber, setMemberNumber] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check if member exists and get their profile
      const { data: member, error: memberError } = await supabase
        .from("members")
        .select("email, auth_user_id, phone")
        .eq("member_number", memberNumber)
        .single();

      if (memberError) throw new Error("Invalid member number");

      if (member.email && member.email !== email) {
        throw new Error("Please use your registered email address");
      }

      // Update member profile with new contact details
      const { error: updateError } = await supabase
        .from("members")
        .update({ 
          email,
          phone 
        })
        .eq("member_number", memberNumber);

      if (updateError) throw updateError;

      // Send reset link
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) throw resetError;

      toast({
        title: "Reset link sent",
        description: "Please check your email for password reset instructions",
      });

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-dashboard-dark border-dashboard-cardBorder">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-[#9b87f5]">Reset Password</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-md p-3 mb-4">
            <p className="text-yellow-500 text-sm">
              Allow up to 15 minutes before retrying.
            </p>
          </div>
          <div>
            <label htmlFor="memberNumber" className="block text-sm font-medium text-dashboard-text mb-2">
              Member Number
            </label>
            <Input
              id="memberNumber"
              value={memberNumber}
              onChange={(e) => setMemberNumber(e.target.value.toUpperCase())}
              placeholder="Enter your member number"
              required
              disabled={loading}
              className="bg-dashboard-card border-dashboard-cardBorder text-dashboard-text focus:border-[#9b87f5]"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-dashboard-text mb-2">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={loading}
              className="bg-dashboard-card border-dashboard-cardBorder text-dashboard-text focus:border-[#9b87f5]"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-dashboard-text mb-2">
              Contact Number
            </label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your contact number"
              required
              disabled={loading}
              className="bg-dashboard-card border-dashboard-cardBorder text-dashboard-text focus:border-[#9b87f5]"
            />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="bg-dashboard-card hover:bg-dashboard-cardHover text-dashboard-text border-dashboard-cardBorder"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-[#9b87f5] hover:bg-[#7E69AB] text-white transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};