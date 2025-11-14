-- Allow deleting submissions
CREATE POLICY "Anyone can delete submissions"
ON public.submissions
FOR DELETE
USING (true);