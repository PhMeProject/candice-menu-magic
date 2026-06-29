
-- Drop old auth-scoped policies
DROP POLICY IF EXISTS "Users manage own meals" ON public.meals;
DROP POLICY IF EXISTS "Users manage own plan" ON public.plan_entries;

-- Remove user scoping
ALTER TABLE public.plan_entries DROP CONSTRAINT plan_entries_pkey;
ALTER TABLE public.plan_entries DROP COLUMN user_id;
ALTER TABLE public.plan_entries ADD PRIMARY KEY (meal_id);

ALTER TABLE public.meals DROP COLUMN user_id;

-- Open access to anon + authenticated
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meals TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plan_entries TO anon;

CREATE POLICY "Anyone can manage meals" ON public.meals
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can manage plan" ON public.plan_entries
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
