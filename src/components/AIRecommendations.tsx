import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Sparkles, Loader2, ExternalLink, TrendingUp, Zap, Star } from "lucide-react";

interface Recommendation {
  name: string;
  category: string;
  description: string;
  estimated_cost: string;
  relevance: "high" | "medium" | "low";
}

export function AIRecommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const getRecommendations = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('recommend-subscriptions');
      
      if (error) {
        throw error;
      }

      if (data.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      setRecommendations(data.recommendations || []);
      setHasLoaded(true);
      
      if (data.recommendations?.length > 0) {
        toast({
          title: "Recommendations Ready",
          description: `Found ${data.recommendations.length} personalized suggestions for you!`,
        });
      }
    } catch (error) {
      console.error("Error getting recommendations:", error);
      toast({
        title: "Error",
        description: "Failed to get recommendations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRelevanceColor = (relevance: string) => {
    switch (relevance) {
      case "high":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "medium":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "low":
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
      default:
        return "bg-primary/20 text-primary border-primary/30";
    }
  };

  const getRelevanceIcon = (relevance: string) => {
    switch (relevance) {
      case "high":
        return <Zap className="h-3 w-3" />;
      case "medium":
        return <TrendingUp className="h-3 w-3" />;
      default:
        return <Star className="h-3 w-3" />;
    }
  };

  return (
    <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none" />
      
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Smart Recommendations</CardTitle>
              <p className="text-sm text-muted-foreground">
                AI-powered suggestions based on your subscriptions
              </p>
            </div>
          </div>
          <Button
            onClick={getRecommendations}
            disabled={isLoading}
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                {hasLoaded ? "Refresh" : "Get Suggestions"}
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="relative">
        {!hasLoaded && !isLoading && (
          <div className="text-center py-8 px-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
              <Sparkles className="h-8 w-8 text-primary/60" />
            </div>
            <p className="text-muted-foreground mb-2">
              Discover new subscriptions tailored to your needs
            </p>
            <p className="text-sm text-muted-foreground/70">
              Click the button above to get AI-powered recommendations
            </p>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 animate-pulse">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
            <p className="text-muted-foreground">
              Analyzing your subscription patterns...
            </p>
          </div>
        )}

        {hasLoaded && recommendations.length === 0 && !isLoading && (
          <div className="text-center py-8 px-4">
            <p className="text-muted-foreground">
              Add some subscriptions first to get personalized recommendations!
            </p>
          </div>
        )}

        {recommendations.length > 0 && !isLoading && (
          <div className="grid gap-4 md:grid-cols-2">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className="group relative p-4 rounded-xl border border-border/50 bg-card/50 hover:bg-card hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold truncate group-hover:text-primary transition-colors">
                        {rec.name}
                      </h4>
                      <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-xs">
                        {rec.category}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={`text-xs flex items-center gap-1 ${getRelevanceColor(rec.relevance)}`}
                      >
                        {getRelevanceIcon(rec.relevance)}
                        {rec.relevance} match
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-semibold text-primary">
                      {rec.estimated_cost}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {rec.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
