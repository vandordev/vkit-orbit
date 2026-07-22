-- Keep River's helper function alongside the River tables and enum.
DO $$
BEGIN
  IF to_regprocedure('public.river_job_state_in_bitmask(bit, river.river_job_state)') IS NOT NULL THEN
    ALTER FUNCTION public.river_job_state_in_bitmask(bit, river.river_job_state) SET SCHEMA river;
  END IF;
END $$;
