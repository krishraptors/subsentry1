import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Sparkles, Loader2, TrendingUp, Zap, Star, Bookmark, X, Check } from "lucide-react";

interface Recommendation {
  name: string;
  category: string;
  description: string;
  estimated_cost: string;
  relevance: "high" | "medium" | "low";
}

interface Interaction {
  recommendation_name: string;
  action: 'saved' | 'dismissed';
}

export function AIRecommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    fetchInteractions();
  }, []);

  const fetchInteractions = async () => {
    const { data } = await supabase
      .from('recommendation_interactions')
      .select('recommendation_name, action');
    if (data) {
      setInteractions(data as Interaction[]);
    }
  };

  const handleInteraction = async (rec: Recommendation, action: 'saved' | 'dismissed') => {
    setSavingId(rec.name);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Error", description: "Please sign in first", variant: "destructive" });
      setSavingId(null);
      return;
    }

    const { error } = await supabase.from('recommendation_interactions').insert({
      user_id: user.id,
      recommendation_name: rec.name,
      action,
      category: rec.category,
      estimated_cost: rec.estimated_cost,
    });

    if (error) {
      toast({ title: "Error", description: "Failed to save interaction", variant: "destructive" });
    } else {
      setInteractions([...interactions, { recommendation_name: rec.name, action }]);
      toast({
        title: action === 'saved' ? "Saved!" : "Dismissed",
        description: action === 'saved' ? `${rec.name} added to your saved list` : `${rec.name} won't be shown again`,
      });
    }
    setSavingId(null);
  };

  const getInteractionStatus = (name: string) => {
    return interactions.find(i => i.recommendation_name === name);
  };

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
            {recommendations.map((rec, index) => {
              const status = getInteractionStatus(rec.name);
              if (status) {
                return (
                  <div
                      key={index}
                    className={`relative p-4 rounded-xl border ${status.action === 'saved' ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-muted/30 bg-muted/5 opacity-60'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {status.action === 'saved' ? (
                          <Bookmark className="h-4 w-4 text-emerald-500 fill-emerald-500" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="font-medium">{rec.name}</span>
                      </div>
                      <Badge variant="outline" className={status.action === 'saved' ? 'text-emerald-500 border-emerald-500/30' : ''}>
                        {status.action === 'saved' ? 'Saved' : 'Dismissed'}
                      </Badge>
                    </div>
                  </div>
                );
              }
              return (
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
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                      {rec.description}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-8 text-xs border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-500"
                        onClick={() => handleInteraction(rec, 'saved')}
                        disabled={savingId === rec.name}
                      >
                        {savingId === rec.name ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <Bookmark className="h-3 w-3 mr-1" />
                            Save
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-8 text-xs"
                        onClick={() => handleInteraction(rec, 'dismissed')}
                        disabled={savingId === rec.name}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Dismiss
                      </Button>
                    </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
