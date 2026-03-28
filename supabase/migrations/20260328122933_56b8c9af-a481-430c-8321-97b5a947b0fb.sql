
CREATE TABLE public.timer_state (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_running boolean NOT NULL DEFAULT false,
  time_left integer NOT NULL DEFAULT 1800,
  last_updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.timer_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view timer_state" ON public.timer_state FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can update timer_state" ON public.timer_state FOR UPDATE TO public USING (true);
CREATE POLICY "Anyone can insert timer_state" ON public.timer_state FOR INSERT TO public WITH CHECK (true);

INSERT INTO public.timer_state (is_running, time_left) VALUES (false, 1800);

ALTER PUBLICATION supabase_realtime ADD TABLE public.timer_state;
