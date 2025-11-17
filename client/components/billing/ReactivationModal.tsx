import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, CheckCircle, Loader2 } from "lucide-react";
import { usePublishCelebration } from "@/hooks/use-publish-celebration";

interface ReactivationModalProps {
  open: boolean;
  onClose: () => void;
  onReactivate: (paymentMethodId: string) => Promise<void>;
  accountStatus: "past_due" | "archived";
}

export function ReactivationModal({
  open,
  onClose,
  onReactivate,
  accountStatus,
}: ReactivationModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const { celebrate } = usePublishCelebration();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Call reactivation API
      await onReactivate("pm_mock_payment_method_id");

      setIsSuccess(true);
      celebrate(true); // Fire confetti 🎉

      // Close modal after success
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
        setCardNumber("");
        setExpiry("");
        setCvc("");
      }, 3000);
    } catch (error) {
      console.error("Reactivation failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        {isSuccess ? (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4 animate-in zoom-in duration-300" />
            <DialogTitle className="text-2xl font-bold text-green-700 mb-2">
              Welcome back! 🎉
            </DialogTitle>
            <DialogDescription className="text-slate-700">
              Your content queue has been restored. Your account is now active.
            </DialogDescription>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                Reactivate Your Account
              </DialogTitle>
              <DialogDescription>
                {accountStatus === "archived"
                  ? "Update your payment method to restore your account and scheduled content."
                  : "We've paused your publishing while waiting for payment. Update your card to resume instantly."}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Card Number</Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiry">Expiry Date</Label>
                  <Input
                    id="expiry"
                    placeholder="MM/YY"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cvc">CVC</Label>
                  <Input
                    id="cvc"
                    placeholder="123"
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value)}
                    maxLength={4}
                    required
                  />
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <p className="text-sm text-purple-900">
                  <strong>What happens next:</strong>
                </p>
                <ul className="text-sm text-purple-800 mt-2 space-y-1 list-disc list-inside">
                  <li>Payment processed instantly</li>
                  <li>Publishing & approvals restored</li>
                  <li>Scheduled content resumes</li>
                  <li>Full platform access unlocked</li>
                </ul>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 gap-2 bg-purple-600 hover:bg-purple-700"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      Reactivate Account
                    </>
                  )}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
