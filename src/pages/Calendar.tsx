import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Subscription {
  id: string;
  name: string;
  cost: number;
  billing_cycle: string;
  renewal_date: string;
  category: string;
}

export default function Calendar() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .order("renewal_date", { ascending: true });

    setSubscriptions(data || []);
    setLoading(false);
  };

  const groupByMonth = (subs: Subscription[]) => {
    const grouped: { [key: string]: Subscription[] } = {};
    
    subs.forEach((sub) => {
      const date = new Date(sub.renewal_date);
      const monthYear = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      
      if (!grouped[monthYear]) {
        grouped[monthYear] = [];
      }
      grouped[monthYear].push(sub);
    });
    
    return grouped;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const groupedSubscriptions = groupByMonth(subscriptions);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Calendar</h1>
        <p className="text-muted-foreground">View upcoming renewal dates</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading calendar...</p>
        </div>
      ) : Object.keys(groupedSubscriptions).length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No upcoming renewals</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedSubscriptions).map(([monthYear, subs]) => (
            <Card key={monthYear}>
              <CardHeader>
                <CardTitle>{monthYear}</CardTitle>
                <CardDescription>{subs.length} renewals this month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {subs.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-center min-w-[50px]">
                          <div className="text-sm font-medium">{formatDate(sub.renewal_date)}</div>
                        </div>
                        <div>
                          <div className="font-medium">{sub.name}</div>
                          <div className="text-sm text-muted-foreground capitalize">{sub.category}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">${sub.cost}</div>
                        <Badge variant="outline" className="text-xs capitalize">
                          {sub.billing_cycle}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
