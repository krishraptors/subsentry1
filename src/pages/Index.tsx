import { SubscriptionFormModal } from "@/components/SubscriptionFormModal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">My Subscriptions</h1>
          <SubscriptionFormModal 
            trigger={
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Subscription
              </Button>
            }
          />
        </div>
        
        <div className="text-center text-muted-foreground py-12">
          <p>No subscriptions yet. Click "Add Subscription" to get started.</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
