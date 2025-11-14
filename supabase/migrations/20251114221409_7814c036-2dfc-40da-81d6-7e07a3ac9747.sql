-- Enable RLS (idempotent if already enabled)
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problems ENABLE ROW LEVEL SECURITY;

-- Allow deleting and updating teams
CREATE POLICY "Anyone can delete teams"
ON public.teams
FOR DELETE
USING (true);

CREATE POLICY "Anyone can update teams"
ON public.teams
FOR UPDATE
USING (true);

-- Allow deleting and updating problems
CREATE POLICY "Anyone can delete problems"
ON public.problems
FOR DELETE
USING (true);

CREATE POLICY "Anyone can update problems"
ON public.problems
FOR UPDATE
USING (true);