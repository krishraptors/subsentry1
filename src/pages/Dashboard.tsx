import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Calendar, CreditCard } from "lucide-react";
import { AIAnalytics } from "@/components/AIAnalytics";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalMonthly: 0,
    totalYearly: 0,
    activeSubscriptions: 0,
    upcomingRenewals: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const { data: subscriptions } = await supabase
      .from("subscriptions")
      .select("*");

    if (subscriptions) {
      const totalMonthly = subscriptions.reduce((sum, sub) => {
        const monthlyCost = calculateMonthlyCost(sub.cost, sub.billing_cycle);
        return sum + monthlyCost;
      }, 0);

      const totalYearly = totalMonthly * 12;
      const activeSubscriptions = subscriptions.length;
      
      // Count renewals in next 30 days
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      const upcomingRenewals = subscriptions.filter((sub) => {
        const renewalDate = new Date(sub.renewal_date);
        return renewalDate <= thirtyDaysFromNow && renewalDate >= new Date();
      }).length;

      setStats({ totalMonthly, totalYearly, activeSubscriptions, upcomingRenewals });
    }
  };

  const calculateMonthlyCost = (cost: number, cycle: string) => {
    switch (cycle) {
      case "weekly":
        return cost * 4;
      case "monthly":
        return cost;
      case "quarterly":
        return cost / 3;
      case "yearly":
        return cost / 12;
      default:
        return cost;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your subscriptions</p>
      </div>

      <AIAnalytics />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Spending</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalMonthly.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">per month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yearly Spending</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalYearly.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">per year</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">total subscriptions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Renewals</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingRenewals}</div>
            <p className="text-xs text-muted-foreground">next 30 days</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
