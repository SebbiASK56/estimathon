-- Create teams table
CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_number integer UNIQUE NOT NULL,
  team_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create problems table
CREATE TABLE public.problems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_number integer UNIQUE NOT NULL,
  question text NOT NULL,
  correct_answer numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create submissions table
CREATE TABLE public.submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  problem_id uuid REFERENCES public.problems(id) ON DELETE CASCADE,
  lower_bound numeric NOT NULL,
  upper_bound numeric NOT NULL,
  score numeric DEFAULT 0,
  submitted_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Create public read policies (for scoreboard viewing)
CREATE POLICY "Anyone can view teams"
  ON public.teams FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view problems"
  ON public.problems FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view submissions"
  ON public.submissions FOR SELECT
  USING (true);

-- Create admin insert policies (for now, allow anyone to insert - you can add auth later)
CREATE POLICY "Anyone can insert teams"
  ON public.teams FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can insert problems"
  ON public.problems FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can insert submissions"
  ON public.submissions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update submissions"
  ON public.submissions FOR UPDATE
  USING (true);

-- Create indexes for performance
CREATE INDEX idx_submissions_team_id ON public.submissions(team_id);
CREATE INDEX idx_submissions_problem_id ON public.submissions(problem_id);
CREATE INDEX idx_submissions_submitted_at ON public.submissions(submitted_at DESC);

-- Enable realtime for live scoreboard updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.teams;
ALTER PUBLICATION supabase_realtime ADD TABLE public.problems;
ALTER PUBLICATION supabase_realtime ADD TABLE public.submissions;