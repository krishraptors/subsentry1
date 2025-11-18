import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SubscriptionFormModalProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function SubscriptionFormModal({ trigger, onSuccess }: SubscriptionFormModalProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [cost, setCost] = useState("");
  const [billingCycle, setBillingCycle] = useState("");
  const [renewalDate, setRenewalDate] = useState<Date>();
  const [category, setCategory] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!renewalDate) {
      toast.error("Please select a renewal date");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    const { error } = await supabase.from("subscriptions").insert({
      user_id: user.id,
      name,
      cost: parseFloat(cost),
      billing_cycle: billingCycle,
      renewal_date: format(renewalDate, "yyyy-MM-dd"),
      category,
    });

    if (error) {
      toast.error("Failed to add subscription");
      console.error(error);
    } else {
      toast.success("Subscription added successfully!");
      setOpen(false);
      setName("");
      setCost("");
      setBillingCycle("");
      setRenewalDate(undefined);
      setCategory("");
      if (onSuccess) onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>Add Subscription</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Subscription</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Subscription Name</Label>
            <Input
              id="name"
              placeholder="Netflix, Spotify, etc."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cost">Cost</Label>
            <Input
              id="cost"
              type="number"
              step="0.01"
              placeholder="9.99"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="billing-cycle">Billing Cycle</Label>
            <Select value={billingCycle} onValueChange={setBillingCycle} required>
              <SelectTrigger id="billing-cycle">
                <SelectValue placeholder="Select billing cycle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Renewal Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !renewalDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {renewalDate ? format(renewalDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={renewalDate}
                  onSelect={setRenewalDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entertainment">Entertainment</SelectItem>
                <SelectItem value="productivity">Productivity</SelectItem>
                <SelectItem value="fitness">Fitness</SelectItem>
                <SelectItem value="software">Software</SelectItem>
                <SelectItem value="utilities">Utilities</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Subscription</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
