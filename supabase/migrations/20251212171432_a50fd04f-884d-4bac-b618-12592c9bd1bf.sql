-- Create table to track recommendation interactions
CREATE TABLE public.recommendation_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  recommendation_name TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('saved', 'dismissed')),
  category TEXT,
  estimated_cost TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.recommendation_interactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own interactions"
ON public.recommendation_interactions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own interactions"
ON public.recommendation_interactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interactions"
ON public.recommendation_interactions
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_recommendation_interactions_user_id ON public.recommendation_interactions(user_id);
CREATE INDEX idx_recommendation_interactions_name ON public.recommendation_interactions(recommendation_name);