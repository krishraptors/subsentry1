import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, Loader2, TrendingUp, DollarSign, Calendar, Target } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AnalyticsSummary {
  total: number;
  monthlySpending: string;
  yearlyProjection: string;
  upcomingRenewals: number;
}

export const AIAnalytics = () => {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<string>("");
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);

  const analyzeSubscriptions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-subscriptions');

      if (error) {
        console.error("Function error:", error);
        if (error.message.includes("429")) {
          toast.error("Rate limit reached. Please try again in a moment.");
        } else if (error.message.includes("402")) {
          toast.error("AI credits exhausted. Please add credits to continue.");
        } else {
          toast.error("Failed to analyze subscriptions");
        }
        return;
      }

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setInsights(data.insights);
      setSummary(data.summary);
      toast.success("Analysis complete!");
    } catch (error) {
      console.error("Error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="glass-effect border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center glow-effect">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-2xl">AI Analytics</CardTitle>
              <CardDescription>Get intelligent insights about your subscriptions</CardDescription>
            </div>
          </div>
          <Button
            onClick={analyzeSubscriptions}
            disabled={loading}
            className="gradient-primary glow-effect hover:scale-105 transition-transform"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Analyze Now
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      {(insights || loading) && (
        <CardContent className="space-y-6">
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="glass-effect p-4 rounded-xl border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-primary" />
                  <p className="text-sm text-muted-foreground">Total Subscriptions</p>
                </div>
                <p className="text-2xl font-bold">{summary.total}</p>
              </div>
              
              <div className="glass-effect p-4 rounded-xl border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  <p className="text-sm text-muted-foreground">Monthly</p>
                </div>
                <p className="text-2xl font-bold">${summary.monthlySpending}</p>
              </div>
              
              <div className="glass-effect p-4 rounded-xl border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <p className="text-sm text-muted-foreground">Yearly Projection</p>
                </div>
                <p className="text-2xl font-bold">${summary.yearlyProjection}</p>
              </div>
              
              <div className="glass-effect p-4 rounded-xl border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <p className="text-sm text-muted-foreground">Upcoming (30d)</p>
                </div>
                <p className="text-2xl font-bold">{summary.upcomingRenewals}</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground">AI is analyzing your subscriptions...</p>
              </div>
            </div>
          ) : insights ? (
            <Alert className="glass-effect border-primary/20">
              <Sparkles className="h-5 w-5 text-primary" />
              <AlertDescription className="mt-2 text-foreground">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <div className="whitespace-pre-wrap">{insights}</div>
                </div>
              </AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      )}
    </Card>
  );
};
