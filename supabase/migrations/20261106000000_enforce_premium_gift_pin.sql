-- Enforce Premium-only PIN protection at the database boundary.
-- Authenticated clients may not grant themselves Premium by updating profiles.plan.
CREATE OR REPLACE FUNCTION public.prevent_client_profile_plan_changes()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public, auth
AS $$
BEGIN
  IF auth.role() = 'authenticated' THEN
    IF TG_OP = 'INSERT' AND NEW.plan IS DISTINCT FROM 'free' THEN
      RAISE EXCEPTION 'Subscription plans can only be changed by trusted billing operations'
        USING ERRCODE = '42501';
    ELSIF TG_OP = 'UPDATE' AND NEW.plan IS DISTINCT FROM OLD.plan THEN
      RAISE EXCEPTION 'Subscription plans can only be changed by trusted billing operations'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_prevent_client_plan_changes
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_client_profile_plan_changes();

-- Existing sender ownership remains required. A non-null PIN hash additionally
-- requires the sender's server-managed profile plan to be Premium.
ALTER POLICY "Sender manages own gifts"
  ON public.gift_stars
  WITH CHECK (
    auth.uid() = sender_id
    AND (
      pin_hash IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE profiles.id = auth.uid()
          AND profiles.plan = 'premium'
      )
    )
  );
