import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SubscriptionFormModal } from "@/components/SubscriptionFormModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";

interface Subscription {
  id: string;
  name: string;
  cost: number;
  billing_cycle: string;
  renewal_date: string;
  category: string;
}

export default function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .order("renewal_date", { ascending: true });

    if (error) {
      toast.error("Failed to fetch subscriptions");
      console.error(error);
    } else {
      setSubscriptions(data || []);
    }
    setLoading(false);
  };

  const deleteSubscription = async (id: string) => {
    const { error } = await supabase
      .from("subscriptions")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete subscription");
      console.error(error);
    } else {
      toast.success("Subscription deleted");
      fetchSubscriptions();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getCycleLabel = (cycle: string) => {
    return cycle.charAt(0).toUpperCase() + cycle.slice(1);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Subscriptions</h1>
          <p className="text-muted-foreground">Manage all your recurring subscriptions</p>
        </div>
        <SubscriptionFormModal
          trigger={
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Subscription
            </Button>
          }
          onSuccess={fetchSubscriptions}
        />
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading subscriptions...</p>
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No subscriptions yet. Click "Add Subscription" to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {subscriptions.map((subscription) => (
            <Card key={subscription.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{subscription.name}</CardTitle>
                    <CardDescription className="capitalize">{subscription.category}</CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteSubscription(subscription.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Cost</span>
                  <span className="font-semibold">${subscription.cost}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Cycle</span>
                  <span>{getCycleLabel(subscription.billing_cycle)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Next Renewal</span>
                  <span>{formatDate(subscription.renewal_date)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
